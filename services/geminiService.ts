import type { MoveHistory } from '../types';

/** The AI coach's note on a round, or '' when the service is off or fails. */
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
      return ''; // the results card writes its own note
    }

    const data = (await response.json()) as { feedback?: string };
    return data.feedback || '';
  } catch (error) {
    console.error('Coach feedback request error:', error);
    return ''; // the results card writes its own note
  }
};
