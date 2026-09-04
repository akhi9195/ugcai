import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma";
import { v2 as cloudanary } from "cloudinary";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import fs from "fs";
import path from "path";
import ai from "../configs/ai";

import axios from "axios";
import { inngest } from "../inngest/client";

const loadImages = (path: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
};

export const createProject = async (req: Request, res: Response) => {
  console.log(">>> 4. createProject() STARTED");
  let tempProjectId: string;
  const { userId } = req.auth();
  let isCreditDeducted = false;

  const {
    name = "New Project",
    aspectRatio,
    userPrompt,
    productName,
    productDescription,
    targetLength = 5,
  } = req.body;

  const images: any = req.files;

  if (images.length < 2 || !productName) {
    return res.status(400).json({ message: "Please upload at least 2 images" });
  }

  console.log("image 1 path:", images[0].path, fs.existsSync(images[0].path));
  console.log("image 2 path:", images[1].path, fs.existsSync(images[1].path));

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || user.credits < 5) {
    return res.status(403).json({ message: "Insufficient credits" });
  } else {
    //deduct credits for image generations
    await prisma.user
      .update({
        where: { id: userId },
        data: { credits: { decrement: 5 } },
      })
      .then(() => {
        isCreditDeducted = true;
      });
  }

  try {
    console.log(">>> ABOUT TO CALL CLOUDINARY");
    let uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        try {
          console.log(">>> Uploading image to Cloudinary");

          const result = await cloudanary.uploader.upload(item.path, {
            resource_type: "image",
          });

          console.log(">>> Cloudinary upload SUCCESS");

          return result.secure_url;
        } catch (error: any) {
          console.error("CLOUDINARY ERROR:");
          console.error("message:", error?.message);
          console.error("http_code:", error?.http_code);
          console.error("name:", error?.name);

          throw error;
        }
      }),
    );
    console.log(">>> Prisma Project Created");
    const project = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLength),
        uploadedImages,
        isGenerating: true,
      },
    });

    tempProjectId = project.id;
    const model = "gemini-3.1-flash-image";
    //const model = "gemini-2.5-flash-image";
    //const model = "gemini-3.1-flash-lite-image";

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    //image to base64 structure for ai model
    const img1base64 = loadImages(images[0].path, images[0].mimetype);
    const img2base64 = loadImages(images[1].path, images[1].mimetype);

    const prompt = {
      text: `Combine the person and product into a realistic photo. 
  Make the person naturally hold or use the product.
  Match lighting, shadows, scale and perspective.
  Make the person stand in professional studio lighting.
  Output ecommerce-quality photo realistic imagery.
  ${userPrompt}`,
    };

    //Generate the image using the ai model

    console.log(">>> ABOUT TO CALL GEMINI");
    console.log(">>> GEMINI MODEL:", model);
    console.log(">>> IMAGE 1 MIME:", images[0].mimetype);
    console.log(">>> IMAGE 2 MIME:", images[1].mimetype);
    console.log(">>> IMAGE 1 SIZE:", fs.statSync(images[0].path).size);
    console.log(">>> IMAGE 2 SIZE:", fs.statSync(images[1].path).size);
    const response: any = await ai.models.generateContent({
      model,
      contents: [img1base64, img2base64, prompt],
      config: generationConfig,
    });

    //check if response is valid
    if (!response?.candidates?.[0]?.content?.parts) {
      console.log(
        ">>> ERROR in GEMINI API CALL. No Success response returned.Response:",
        response,
      );
      throw new Error(
        "Unexpected response." + JSON.stringify(response, null, 2),
      );
    }
    console.log(">>> SUCCESSFULLY Recived GEMINI API Response.");
    const parts = response.candidates[0].content.parts;
    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) {
      console.log(">>> Failed to generate image from GEMINI");
      throw new Error("Failed to generate image");
    }
    console.log(">>> SUCCESSFULLY generated the image by AI");
    const base64Image = `data:image/png;base64,${finalBuffer.toString("base64")}`;
    const uploadResult = await cloudanary.uploader.upload(base64Image, {
      resource_type: "image",
    });
    console.log(
      ">>> SUCCESSFULLY uploaded the AI generated image into cloudinary",
    );

    await prisma.project.update({
      where: { id: project.id },
      data: { generatedImage: uploadResult.secure_url, isGenerating: false },
    });

    console.log(
      ">>> SUCCESSFULLY stored the AI generated image URL into neon db",
    );
    res.json({ projectId: project.id });
  } catch (error: any) {
    if (tempProjectId!) {
      await prisma.project.update({
        where: { id: tempProjectId },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    }

    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
    }

    Sentry.captureException(error);

    let statusCode = error?.status || 500;
    let errorMessage = error?.message || "Something went wrong";

    try {
      const parsedError = JSON.parse(error.message);

      if (parsedError?.error) {
        statusCode = parsedError.error.code || statusCode;
        errorMessage = parsedError.error.message || errorMessage;
      }
    } catch {
      // error.message was not JSON
    }

    res.status(statusCode).json({
      message: errorMessage,
    });
  }
}; // <-- this closes createProject

// export const createVideo = async (req: Request, res: Response) => {
//   const { userId } = req.auth();
//   let isCreditDeducted = false;
//   try {
//     console.log("\n========== VIDEO GENERATION START ==========");
//     console.log("[1] User ID:", userId);
//     const { projectId } = req.body;
//     console.log("[2] Project ID:", projectId);

//     // --------------------------------------------------
//     // 1. Get user

//     console.log("[3] Fetching user...");
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     console.log("[3] User found:", !!user);
//     console.log("[3] User credits:", user?.credits);

//     if (!user || user.credits < 10) {
//       return res.status(403).json({ message: "Insufficient credits" });
//     }

//     // 2. Get project
//     // console.log("[4] Fetching project...");

//     const project = await prisma.project.findUnique({
//       where: { id: projectId, userId },
//       include: { user: true },
//     });
//     console.log("[4] Project found:", !!project);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     console.log("[4] Product:", project.productName);
//     console.log("[4] Aspect ratio:", project.aspectRatio);
//     console.log("[4] Generated image:", !!project.generatedImage);
//     console.log("[4] Generated video:", !!project.generatedVideo);
//     console.log("[4] Is generating:", project.isGenerating);

//     if (project.isGenerating) {
//       console.error("[ERROR] Generation already in progress");
//       return res.status(409).json({ message: "Generation in progress" });
//     }

//     if (project.generatedVideo) {
//       console.error("[ERROR] Video already generated");
//       return res.status(409).json({ message: "video already generated" });
//     }

//     if (!project.generatedImage) {
//       console.error("[ERROR] Generated image not found");
//       return res
//         .status(400)
//         .json({ message: "Generated image not found. Generate image first!" });
//     }

//     // 3. Mark project as generating
//     console.log("[5] Marking project as generating...");

//     await prisma.project.update({
//       where: { id: projectId },
//       data: { isGenerating: true },
//     });

//     console.log("[5] Project marked as generating");

//     // 4. Deduct credits

//     console.log("[6] Deducting 10 credits...");

//     await prisma.user
//       .update({
//         where: { id: userId },
//         data: { credits: { decrement: 10 } },
//       })
//       .then(() => {
//         isCreditDeducted = true;
//       });

//     console.log("[6] Credits deducted successfully");

//     //const prompt = `make the person showcase the product which is ${project.productName} ${project.productDescription} && and Product Description: ${project.productDescription}`;
//     const prompt = `
// Create a natural UGC product showcase for ${project.productName}.
// Product: ${project.productDescription}

// Make the person naturally showcase and use the product.
// Speak ONLY in English with a natural, clear voice.
// English dialogue only. No other languages.
// Ensure lip-sync matches the speech.
// `;

//     console.log("[7] Video prompt:", prompt);
//     //const model = "veo-3.1-generate-preview";
//     // 6. Select model

//     const model = "veo-3.1-fast-generate-preview";

//     console.log("[8] Video model:", model);
//     console.log("[8] Resolution: 720p");
//     console.log("[8] Aspect ratio:", project.aspectRatio || "9:16");

//     // 7. Download generated image from Cloudinary

//     console.log("[9] Downloading generated image...");
//     console.log("[9] Image URL:", project.generatedImage);

//     const image = await axios.get(project.generatedImage, {
//       responseType: "arraybuffer",
//     });

//     console.log("[9] Image downloaded successfully");
//     console.log("[9] Image content-type:", image.headers["content-type"]);
//     console.log("[9] Image size:", image.data.length, "bytes");

//     const imageBytes = Buffer.from(image.data);
//     const mimeType = image.headers["content-type"] || "image/png";
//     console.log("[9] MIME type being sent to Veo:", mimeType);

//     // 8. Start Veo generation
//     console.log("[10] Starting Veo video generation...");
//     console.log("[10] This may take several minutes...");

//     let operation: any = await ai.models.generateVideos({
//       model,
//       prompt,
//       image: {
//         imageBytes: imageBytes.toString("base64"),
//         mimeType,
//       },
//       config: {
//         aspectRatio: project?.aspectRatio || "9:16",
//         numberOfVideos: 1,
//         resolution: "720p",
//       },
//     });

//     console.log("[10] Veo generation request accepted");
//     console.log("[10] Operation:", operation);
//     // --------------------------------------------------
//     // 9. Poll Veo operation

//     let pollCount = 0;
//     while (!operation.done) {
//       pollCount++;
//       console.log(`[11] Waiting for Veo generation... Poll #${pollCount}`);
//       await new Promise((resolve) => setTimeout(resolve, 10000));

//       console.log(`[11] Checking Veo operation status... Poll #${pollCount}`);

//       operation = await ai.operations.getVideosOperation({
//         operation: operation,
//       });
//       console.log(`[11] Operation completed: ${operation.done}`);
//     }

//     console.log("[11] Veo operation finished");
//     console.log(
//       "[11] Generated videos:",
//       operation.response?.generatedVideos?.length || 0,
//     );

//     // 10. Validate Veo response
//     // console.log("[12] Validating Veo response...");
//     if (!operation.response?.generatedVideos?.[0]?.video) {
//       const reason =
//         operation.response?.raiMediaFilteredReasons?.[0] ||
//         "Video generation failed";
//       console.error("[12] Veo generation failed");
//       console.error("[12] Reason:", reason);
//       console.error(
//         "[12] Full response:",
//         JSON.stringify(operation.response, null, 2),
//       );
//       throw new Error(reason);
//     }
//     console.log("[12] Veo video generated successfully");

//     // 11. Prepare local video file
//     const filename = `${userId}-${Date.now()}.mp4`;
//     const filePath = path.join("videos", filename);

//     console.log("[13] Video filename:", filename);
//     console.log("[13] Video path:", filePath);

//     //create the images directory if it doesn't exist
//     fs.mkdirSync("videos", { recursive: true });

//     // 12. Download video from Veo
//     console.log("[14] Downloading generated video...");

//     //Download the video
//     await ai.files.download({
//       file: operation.response.generatedVideos[0].video,
//       downloadPath: filePath,
//     });

//     console.log("[14] Video downloaded successfully");
//     // 13. Upload video to Cloudinary
//     console.log("[15] Uploading video to Cloudinary...");

//     const uploadResult = await cloudanary.uploader.upload(filePath, {
//       resource_type: "video",
//     });

//     console.log("[15] Cloudinary upload successful");
//     console.log("[15] Cloudinary URL:", uploadResult.secure_url);

//     // 14. Update Prisma
//     console.log("[16] Updating project with generated video...");

//     await prisma.project.update({
//       where: { id: project.id },
//       data: {
//         generatedVideo: uploadResult.secure_url,
//         isGenerating: false,
//       },
//     });

//     console.log("[16] Project updated successfully");

//     // 15.remove local video file from disk after upload
//     console.log("[17] Removing local video file...");

//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       console.log("[17] Local video file removed");
//     }

//     // 16. Success
//     console.log("========== VIDEO GENERATION SUCCESS ==========\n");

//     res.json({
//       message: "Video generation completed",
//       videoUrl: uploadResult.secure_url,
//     });
//   } catch (error: any) {
//     console.error("\n========== VIDEO GENERATION FAILED ==========");
//     console.error("[ERROR] Message:", error.message);
//     console.error("[ERROR] Stack:", error.stack);

//     // Reset project state status and error message

//     try {
//       console.log("[ERROR] Resetting project generation status...");
//       const { projectId } = req.body;
//       await prisma.project.update({
//         where: { id: projectId, userId },
//         data: { isGenerating: false, error: error.message },
//       });
//       console.log("[ERROR] Project status reset successfully");
//     } catch (dbError: any) {
//       console.error("[ERROR] Failed to reset project:", dbError.message);
//     }

//     if (isCreditDeducted) {
//       try {
//         console.log("[ERROR] Refunding 10 credits...");
//         await prisma.user.update({
//           where: { id: userId },
//           data: { credits: { increment: 10 } },
//         });
//         console.log("[ERROR] Credits refunded successfully");
//       } catch (refundError: any) {
//         console.error("[ERROR] Failed to refund credits:", refundError.message);
//       }
//     }

//     Sentry.captureException(error);
//     console.error("========== END VIDEO GENERATION ERROR ==========\n");
//     res.status(500).json({ message: error.message });
//   }
// };

export const createVideo = async (req: Request, res: Response) => {
  const { userId } = req.auth();
  let isCreditDeducted = false;
  let tempProjectId: string | undefined;
  try {
    const { projectId } = req.body;
    tempProjectId = projectId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 10) {
      return res.status(403).json({ message: "Insufficient credits" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.isGenerating) {
      return res.status(409).json({ message: "Generation in progress" });
    }

    if (project.generatedVideo) {
      return res.status(409).json({ message: "video already generated" });
    }

    if (!project.generatedImage) {
      return res
        .status(400)
        .json({ message: "Generated image not found. Generate image first!" });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { isGenerating: true },
    });

    await prisma.user
      .update({
        where: { id: userId },
        data: { credits: { decrement: 10 } },
      })
      .then(() => {
        isCreditDeducted = true;
      });

    // Hand off the actual Veo generation + polling to a durable Inngest
    // background job (inngest/functions.ts) instead of running it inline.
    await inngest.send({
      name: "project/video.requested",
      data: { projectId, userId },
    });

    res.json({ message: "Video generation started" });
  } catch (error: any) {
    if (tempProjectId) {
      try {
        await prisma.project.update({
          where: { id: tempProjectId, userId },
          data: { isGenerating: false, error: error.message },
        });
      } catch (dbError: any) {
        Sentry.captureException(dbError);
      }
    }

    if (isCreditDeducted) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: 10 } },
        });
      } catch (refundError: any) {
        Sentry.captureException(refundError);
      }
    }

    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllPublishedProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params as { projectId: string };

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: "Project deleted" });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
