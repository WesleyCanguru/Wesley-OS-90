import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    // Check import.meta.env for Vite/Vercel deployments
    const key = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please check your environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function generateDailyFeedback(foodLogs: any[], targets: any) {
  try {
    const ai = getAIClient();
    
    const prompt = `
      Atue como um nutricionista amigável e motivador.
      Aqui está o resumo da alimentação do seu paciente hoje:
      Metas: ${targets.calories} kcal, ${targets.protein}g proteína, ${targets.carbs}g carboidratos, ${targets.fats}g gorduras.
      Consumo real:
      ${foodLogs.map(log => `- ${log.name}: ${log.calories} kcal, ${log.protein}g prot, ${log.carbs}g carb, ${log.fat}g gord`).join('\n')}
      
      Faça um feedback curto (máximo 3 parágrafos curtos) sobre o dia dele.
      Elogie o que foi bom, dê um toque no que passou ou faltou, e termine com uma frase motivacional.
      Use emojis. Não use formatação markdown complexa, apenas texto simples.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Não foi possível gerar o feedback no momento. Continue firme no seu propósito!";
  }
}
export async function calculateMacros(mealDescription: string) {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Calculate the nutritional macros for the following meal: "${mealDescription}". Return ONLY a JSON object with the following properties: name (a short 3-5 word summary of the meal), calories (number), protein (number in grams), carbs (number in grams), fats (number in grams). Do not include any markdown formatting or other text.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Short summary of the meal" },
            calories: { type: Type.NUMBER, description: "Total calories" },
            protein: { type: Type.NUMBER, description: "Total protein in grams" },
            carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams" },
            fats: { type: Type.NUMBER, description: "Total fats in grams" },
          },
          required: ["name", "calories", "protein", "carbs", "fats"],
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
    throw error;
  }
}
