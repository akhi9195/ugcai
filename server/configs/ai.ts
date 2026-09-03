import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});

console.log(
  "Gemini key loaded:",
  process.env.GOOGLE_CLOUD_API_KEY
    ? `${process.env.GOOGLE_CLOUD_API_KEY.slice(0, 8)}...`
    : "NO KEY",
);

export default ai;
