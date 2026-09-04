import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma";
//Get User Credits
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    res.json({ credits: user?.credits });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Get all user projects
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    // if (!userId) {
    //   return res.status(401).json({ message: "Unathorized" });
    // }
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Get project by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params as { projectId: string };
    // if (!userId) {
    //   return res.status(401).json({ message: "Unathorized" });
    // }
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ project });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Publish / Unpublish project
export const toggleProjectPublic = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params as { projectId: string };
    // if (!userId) {
    //   return res.status(401).json({ message: "Unathorized" });
    // }
    console.log("========== TOGGLE PUBLISH ==========");
    console.log("userId:", userId);
    console.log("projectId:", projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    console.log("project found:", !!project);

    if (project) {
      console.log("project.id:", project.id);
      console.log("project.userId:", project.userId);
    }

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project?.generatedImage && !project.generatedVideo) {
      console.log("No generated image or video");
      return res.status(404).json({ message: "image or video not generated" });
    }

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: { isPublished: !project.isPublished },
    });
    res.json({ isPublished: !project.isPublished });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
