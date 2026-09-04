import fs from "fs";
import os from "os";
import path from "path";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import * as Sentry from "@sentry/node";

import { inngest } from "./client";
import { prisma } from "../configs/prisma";
import ai from "../configs/ai";

const GEMINI_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    retries: 1,
    triggers: { event: "project/video.requested" },
  },

  async ({ event, step }) => {
    const { projectId, userId } = event.data as {
      projectId: string;
      userId: string;
    };

    try {
      const project = await step.run("load-project", async () => {
        const p = await prisma.project.findUnique({
          where: { id: projectId, userId },
        });

        if (!p) throw new Error("Project not found");
        if (!p.generatedImage) {
          throw new Error("Generated image not found");
        }

        return {
          generatedImage: p.generatedImage,
          productName: p.productName,
          productDescription: p.productDescription,
          aspectRatio: p.aspectRatio,
        };
      });

      const sourceImage = await step.run("download-source-image", async () => {
        const image = await axios.get(project.generatedImage, {
          responseType: "arraybuffer",
        });

        return {
          base64: Buffer.from(image.data).toString("base64"),
          mimeType: (image.headers["content-type"] as string) || "image/png",
        };
      });

      const prompt = `
Create a natural UGC product showcase for ${project.productName}.

Product: ${project.productDescription}

Make the person naturally showcase and use the product.

Speak ONLY in English with a natural, clear voice.

English dialogue only. No other languages.

Ensure lip-sync matches the speech.
`;

      const model = "veo-3.1-fast-generate-preview";

      // CHANGED:
      // Store ONLY the operation name.
      // Do not allow the Google SDK operation object to cross
      // an Inngest step boundary.
      const operationName = await step.run("start-veo-generation", async () => {
        const operation = await ai.models.generateVideos({
          model,
          prompt,
          image: {
            imageBytes: sourceImage.base64,
            mimeType: sourceImage.mimeType,
          },
          config: {
            aspectRatio: project.aspectRatio || "9:16",
            numberOfVideos: 1,
            resolution: "720p",
          },
        });

        if (!operation.name) {
          throw new Error("Veo did not return an operation name");
        }

        return operation.name;
      });

      let operation: any = null;
      let pollCount = 0;

      const MAX_POLLS = 60;

      // Poll until generation completes
      while (true) {
        pollCount++;

        if (pollCount > MAX_POLLS) {
          throw new Error("Video generation timed out after 10 minutes");
        }

        await step.sleep(`wait-for-veo-${pollCount}`, "10s");

        // CHANGED:
        // Poll Gemini using the operation NAME.
        // This returns plain JSON and is safe across Inngest steps.
        operation = await step.run(`poll-veo-${pollCount}`, async () => {
          const response = await axios.get(
            `${GEMINI_BASE_URL}/${operationName}`,
            {
              headers: {
                "x-goog-api-key": GEMINI_API_KEY,
              },
            },
          );

          console.log(
            "VEO OPERATION RESPONSE:",
            JSON.stringify(response.data, null, 2),
          );

          return response.data;
        });

        console.log(`Veo poll ${pollCount}: done=${operation.done}`);

        if (operation.done) {
          break;
        }
      }

      const videoUri =
        operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video
          ?.uri;

      if (!videoUri) {
        const reason =
          operation.response?.generateVideoResponse
            ?.raiMediaFilteredReasons?.[0] ||
          operation.error?.message ||
          "Video generation failed";

        throw new Error(reason);
      }

      const videoUrl = await step.run("download-and-upload-video", async () => {
        const filename = `${userId}-${Date.now()}.mp4`;
        const filePath = path.join(os.tmpdir(), filename);

        // CHANGED:
        // Download the generated video using the URI
        // returned by Gemini.
        const videoResponse = await axios.get(videoUri, {
          headers: {
            "x-goog-api-key": GEMINI_API_KEY,
          },
          responseType: "arraybuffer",
        });

        fs.writeFileSync(filePath, Buffer.from(videoResponse.data));

        const uploadResult = await cloudinary.uploader.upload(filePath, {
          resource_type: "video",
        });

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return uploadResult.secure_url;
      });

      await step.run("save-success", async () => {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            generatedVideo: videoUrl,
            isGenerating: false,
          },
        });
      });

      return { videoUrl };
    } catch (error: any) {
      await step.run("save-failure-and-refund", async () => {
        await prisma.project.update({
          where: {
            id: projectId,
            userId,
          },
          data: {
            isGenerating: false,
            error: error.message,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: 10,
            },
          },
        });
      });

      Sentry.captureException(error);

      throw error;
    }
  },
);

export const inngestFunctions = [generateVideo];
