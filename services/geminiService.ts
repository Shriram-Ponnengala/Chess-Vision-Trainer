import type { MoveHistory } from '../types';

export const getCoachFeedback = async (
  history: MoveHistory[],
  score: number,
  accuracy: number
): Promise<string> => {
  try {
    const response = await fetch('/api/coach-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history, score, accuracy }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Coach feedback API error:', errorData.error || response.statusText);
      return 'Great effort! Review your missed squares to improve next time.';
    }

    const data = (await response.json()) as { feedback?: string };
    return data.feedback || 'Great job practicing! Keep working on your visualization.';
  } catch (error) {
    console.error('Coach feedback request error:', error);
    return 'Great effort! Review your missed squares to improve next time.';
  }
};
