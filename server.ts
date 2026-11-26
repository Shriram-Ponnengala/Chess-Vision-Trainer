import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { MoveHistory } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/coach-feedback', async (req, res) => {
    try {
      const { history, score, accuracy } = req.body as {
        history?: MoveHistory[];
        score?: number;
        accuracy?: number;
      };

      if (!Array.isArray(history) || typeof score !== 'number' || typeof accuracy !== 'number') {
        res.status(400).json({ error: 'Invalid session stats payload.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({ error: 'Coach service is currently unavailable.' });
        return;
      }

      const ai = getGeminiClient();

      const mistakes = history
        .filter((h) => !h.wasCorrect)
        .map((h) => `${h.target.file}${h.target.rank}`);
      const correctCount = history.filter((h) => h.wasCorrect).length;
      const slowMoves = history
        .filter((h) => h.timeTakenMs > 3000 && h.wasCorrect)
        .map((h) => `${h.target.file}${h.target.rank}`);

      const prompt = `
        You are a friendly, encouraging chess coach for a child aged 8-14.
        Analyze this 'Square Trainer' training session.

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
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a supportive, expert chess coach for kids. Keep tone positive, constructive, and concise.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const feedback =
        response.text?.trim() || 'Great job practicing! Keep working on your visualization.';

      res.json({ feedback });
    } catch (error) {
      console.error('Gemini API Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate coach feedback';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
