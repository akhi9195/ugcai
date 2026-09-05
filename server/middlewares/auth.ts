import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { AuthedRequest } from "../types/express";
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = (req as AuthedRequest).auth();
    if (!userId) {
      return res.status(401).json({ mssage: "Unauthorized" });
    }
    next();
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(401).json({ message: error.code || error.message });
  }
};
