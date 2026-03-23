import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please check your environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function calculateMacros(mealDescription: string) {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: `Calculate the nutritional macros for the following meal: "${mealDescription}". Return ONLY a JSON object with the following properties: calories (number), protein (number in grams), carbs (number in grams), fats (number in grams). Do not include any markdown formatting or other text.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER, description: "Total calories" },
            protein: { type: Type.NUMBER, description: "Total protein in grams" },
            carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams" },
            fats: { type: Type.NUMBER, description: "Total fats in grams" },
          },
          required: ["calories", "protein", "carbs", "fats"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Error calculating macros:", error);
    return null;
  }
}
