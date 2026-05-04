import { streamText } from "ai";
import { ollama } from "ollama-ai-provider";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const result = await streamText({
      model: ollama({
        model: "llama3.2:3b",
        baseURL: "http://localhost:11434",
      }),
      system: `You are TanomAI, a friendly and expert agricultural assistant for farmers in Cotabato, Philippines.
        - Your goal is to provide helpful, concise, and practical advice.
        - Always speak in a friendly, encouraging, and respectful tone. Use "Ate" or "Kuya" when appropriate.
        - Your knowledge is focused on crops, farming techniques, market prices, and weather conditions relevant to the Cotabato region.
        - If a question is outside your expertise (e.g., politics, entertainment), politely state that you are focused on agriculture and cannot answer.
        - Keep your answers brief and to the point.`,
      messages,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error("[Chatbot API Error]:", error);
    return new Response(JSON.stringify({ error: "Failed to get response from AI model." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}