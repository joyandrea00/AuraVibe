export type FocusState =
  | "CALIBRATING"
  | "FOCUSED"
  | "DEEP_FOCUS"
  | "UNSTABLE"
  | "ATTENTION_DRIFT"
  | "IDLE";

interface FocusMetrics {
  wpm: number;
  consistency: number;
  pauseDuration: number;
}

export function calculateFocusScore({
  wpm,
  consistency,
  pauseDuration,
}: FocusMetrics): number {
  let score = 40;

  // Typing activity contribution
  if (wpm >= 25 && wpm <= 90) {
    score += 25;
  } else if (wpm > 10) {
    score += 15;
  }

  // Consistency contribution
  score += (consistency / 100) * 25;

  // Long pauses reduce focus score
  if (pauseDuration > 10) {
    score -= 25;
  } else if (pauseDuration > 5) {
    score -= 15;
  } else if (pauseDuration > 3) {
    score -= 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function determineFocusState(
  score: number,
  pauseDuration: number
): FocusState {
  if (pauseDuration > 10) {
    return "IDLE";
  }

  if (pauseDuration > 5) {
    return "ATTENTION_DRIFT";
  }

  if (score >= 85) {
    return "DEEP_FOCUS";
  }

  if (score >= 65) {
    return "FOCUSED";
  }

  if (score >= 45) {
    return "UNSTABLE";
  }

  return "CALIBRATING";
}