// Vercel serverless entrypoint. Every request is routed here by vercel.json.
// This just re-exports the shared Express app — Vercel wraps it as a handler,
// there is no app.listen() call in this file/path.
import app from "../app";

export default app;
