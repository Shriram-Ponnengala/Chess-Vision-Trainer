import { GoogleGenAI } from "@google/genai";
import { MoveHistory } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getCoachFeedback = async (history: MoveHistory[], score: number, accuracy: number): Promise<string> => {
  if (!API_KEY) {
    return "AI Coach unavailable (API Key missing). Great job on your practice!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Filter pertinent data to save tokens and focus context
    const mistakes = history.filter(h => !h.wasCorrect).map(h => `${h.target.file}${h.target.rank}`);
    const correctCount = history.filter(h => h.wasCorrect).length;
    const slowMoves = history.filter(h => h.timeTakenMs > 3000 && h.wasCorrect).map(h => `${h.target.file}${h.target.rank}`);

    const prompt = `
      You are a friendly, encouraging chess coach for a child aged 8-14. 
      Analyze this 'Coordinate Defense' training session.
      
      Stats:
      - Score: ${score}
      - Accuracy: ${accuracy}%
      - Total Moves: ${history.length}
      - Correct: ${correctCount}
      - Mistakes on squares: ${mistakes.join(', ') || 'None!'}
      - Slow reactions on: ${slowMoves.join(', ') || 'None'}

      Provide a 3-sentence summary:
      1. Acknowledge their effort enthusiastically.
      2. Identify a specific pattern in their mistakes (e.g., "You seem to mix up the Queen side files" or "Rank 7 is tricky for you") or praise their consistency if near perfect.
      3. Give one quick tip to improve coordinate visualization.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a supportive, expert chess coach for kids. Keep tone positive, constructive, and concise.",
        temperature: 0.7,
      }
    });

    return response.text || "Great job practicing! Keep working on your visualization.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Great effort! Review your missed squares to improve next time.";
  }
};
