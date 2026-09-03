export type FocusState =
  | "CALIBRATING"
  | "FOCUSED"
  | "DEEP_FOCUS"
  | "UNSTABLE"
  | "ATTENTION_DRIFT"
  | "IDLE";

export interface FocusSessionData {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;

  duration: number;

  focusScore: number;
  averageWpm: number;

  consistency: number;
  averageConsistency: number;

  driftEvents: number;

  focusState: FocusState;
  dominantFocusState: FocusState;

  focusStateDistribution: Record<FocusState, number>;

  soundscape: string;
}