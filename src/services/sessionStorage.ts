
import type { FocusSessionData, FocusState } from "../types/session";

const STORAGE_KEY = "auravibe_focus_sessions";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const FOCUS_STATES: FocusState[] = [
  "CALIBRATING",
  "FOCUSED",
  "DEEP_FOCUS",
  "UNSTABLE",
  "ATTENTION_DRIFT",
  "IDLE",
];

const isFocusState = (value: unknown): value is FocusState =>
  typeof value === "string" &&
  FOCUS_STATES.includes(value as FocusState);

// Normalize older or incomplete session records.
const normalizeSession = (value: unknown): FocusSessionData | null => {
  if (!value || typeof value !== "object") return null;

  const session = value as Partial<FocusSessionData>;

  if (
    typeof session.id !== "string" ||
    typeof session.title !== "string" ||
    typeof session.date !== "string" ||
    typeof session.duration !== "number" ||
    typeof session.focusScore !== "number"
  ) {
    return null;
  }

  const focusState: FocusState = isFocusState(session.focusState)
    ? session.focusState
    : "FOCUSED";

  const dominantFocusState: FocusState = isFocusState(
    session.dominantFocusState
  )
    ? session.dominantFocusState
    : focusState;

  const consistency =
    typeof session.consistency === "number"
      ? session.consistency
      : typeof session.averageConsistency === "number"
        ? session.averageConsistency
        : 0;

  const oldDistribution = session.focusStateDistribution;

  const focusStateDistribution: Record<FocusState, number> = {
    CALIBRATING:
      typeof oldDistribution?.CALIBRATING === "number"
        ? oldDistribution.CALIBRATING
        : 0,
    FOCUSED:
      typeof oldDistribution?.FOCUSED === "number"
        ? oldDistribution.FOCUSED
        : 0,
    DEEP_FOCUS:
      typeof oldDistribution?.DEEP_FOCUS === "number"
        ? oldDistribution.DEEP_FOCUS
        : 0,
    UNSTABLE:
      typeof oldDistribution?.UNSTABLE === "number"
        ? oldDistribution.UNSTABLE
        : 0,
    ATTENTION_DRIFT:
      typeof oldDistribution?.ATTENTION_DRIFT === "number"
        ? oldDistribution.ATTENTION_DRIFT
        : 0,
    IDLE:
      typeof oldDistribution?.IDLE === "number"
        ? oldDistribution.IDLE
        : 0,
  };

  return {
    id: session.id,
    title: session.title,
    date: session.date,
    startTime:
      typeof session.startTime === "string"
        ? session.startTime
        : session.date,
    endTime:
      typeof session.endTime === "string"
        ? session.endTime
        : session.date,
    duration: session.duration,
    focusScore: session.focusScore,
    averageWpm:
      typeof session.averageWpm === "number"
        ? session.averageWpm
        : 0,
    consistency,
    averageConsistency:
      typeof session.averageConsistency === "number"
        ? session.averageConsistency
        : consistency,
    driftEvents:
      typeof session.driftEvents === "number"
        ? session.driftEvents
        : 0,
    focusState,
    dominantFocusState,
    focusStateDistribution,
    soundscape:
      typeof session.soundscape === "string"
        ? session.soundscape
        : "Unknown",
  };
};

// Read sessions stored in the browser.
export const getSessions = (): FocusSessionData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeSession)
      .filter(
        (session): session is FocusSessionData => session !== null
      );
  } catch (error) {
    console.error("Error loading AuraVibe sessions:", error);
    return [];
  }
};

// Save locally first, then attempt to save to the backend.
export const saveSession = async (
  session: FocusSessionData
): Promise<void> => {
  try {
    const sessions = getSessions();
    const updated = [
      session,
      ...sessions.filter((item) => item.id !== session.id),
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving session locally:", error);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    console.log("Focus session synced with the backend.");
  } catch (error) {
    console.error(
      "Backend sync failed; the local session is retained:",
      error
    );
  }
};

// Fetch cloud sessions and merge them with local sessions.
export const syncSessionsFromBackend =
  async (): Promise<FocusSessionData[]> => {
    const response = await fetch(`${API_BASE_URL}/sessions`);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data: { sessions?: unknown[] } = await response.json();

    const remoteSessions = Array.isArray(data.sessions)
      ? data.sessions
          .map(normalizeSession)
          .filter(
            (session): session is FocusSessionData =>
              session !== null
          )
      : [];

    const sessionsById = new Map<string, FocusSessionData>();

    // Add local sessions first.
    getSessions().forEach((session) => {
      sessionsById.set(session.id, session);
    });

    // Cloud versions replace local versions with matching IDs.
    remoteSessions.forEach((session) => {
      sessionsById.set(session.id, session);
    });

    const mergedSessions = Array.from(sessionsById.values()).sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(mergedSessions)
      );
    } catch (error) {
      console.error("Error caching synced sessions:", error);
    }

    return mergedSessions;
  };

// Delete a session from local browser history.
export const deleteSession = (id: string): void => {
  try {
    const updated = getSessions().filter(
      (session) => session.id !== id
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error deleting session:", error);
  }
};

// Clear local browser history.
export const clearSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing sessions:", error);
  }
};
