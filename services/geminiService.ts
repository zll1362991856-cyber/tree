import { GoogleGenAI } from "@google/genai";

// Initialize the client
// process.env.API_KEY is guaranteed to be available by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHolidayWish = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Write a single, short, magical, and poetic Christmas wish (max 20 words). Focus on light, warmth, and hope. Do not use quotes.",
      config: {
        temperature: 1.0,
      }
    });

    return response.text?.trim() || "May your holidays be filled with light and joy.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Could not catch the holiday spirit right now.");
  }
};