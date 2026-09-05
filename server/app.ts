import "./configs/instrument.js";
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerk";
import * as Sentry from "@sentry/node";
import userRouter from "./routes/userRoutes";
import projectRouter from "./routes/projectRoutes";
import { serve as inngestServe } from "inngest/express";
import { inngest } from "./inngest/client";
import { inngestFunctions } from "./inngest/functions";
const app = express();
console.log(">>> INCOMING REQUEST 1:");

app.use((req, res, next) => {
  res.setHeader("X-Debug-Server", "AK-UGC-SERVER-001");
  console.error(">>> REQUEST:", req.method, req.originalUrl);
  next();
});
// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);

app.post(
  "/api/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks,
);

app.use(express.json({ limit: "20mb" }));
app.use(clerkMiddleware());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live! DEBUG-001");
});

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

//  Inngest calls back into this route to run/resume each step of
// generateVideo. This is what makes the whole "no single invocation runs
// longer than a few seconds" thing work.
app.use(
  "/api/inngest",
  inngestServe({ client: inngest, functions: inngestFunctions }),
);

app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);
// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

export default app;
