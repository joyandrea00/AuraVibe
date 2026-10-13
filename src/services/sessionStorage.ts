
import type { FocusSessionData, FocusState } from "../types/session";

const STORAGE_KEY = "auravibe_focus_sessions";
const API_BASE_URL = "https://auravibe.onrender.com/api";

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

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const normalizeSession = (
  value: unknown
): FocusSessionData | null => {
  if (!isRecord(value)) return null;

  const session = value;

  if (
    typeof session.id !== "string" ||
    typeof session.title !== "string" ||
    typeof session.duration !== "number" ||
    typeof session.focusScore !== "number"
  ) {
    return null;
  }

  const date =
    typeof session.date === "string" && session.date
      ? session.date
      : typeof session.startTime === "string"
        ? session.startTime
        : new Date().toISOString();

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

  const oldDistribution = isRecord(session.focusStateDistribution)
    ? session.focusStateDistribution
    : {};

  const focusStateDistribution = Object.fromEntries(
    FOCUS_STATES.map((state) => [
      state,
      typeof oldDistribution[state] === "number"
        ? oldDistribution[state]
        : 0,
    ])
  ) as Record<FocusState, number>;

  return {
    id: session.id,
    title: session.title,
    date,
    startTime:
      typeof session.startTime === "string"
        ? session.startTime
        : date,
    endTime:
      typeof session.endTime === "string"
        ? session.endTime
        : date,
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

export const getSessions = (): FocusSessionData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const uniqueSessions = new Map<string, FocusSessionData>();

    parsed.forEach((item) => {
      const session = normalizeSession(item);
      if (session) uniqueSessions.set(session.id, session);
    });

    return Array.from(uniqueSessions.values());
  } catch (error) {
    console.error("Error loading AuraVibe sessions:", error);
    return [];
  }
};

export const saveSession = async (
  session: FocusSessionData
): Promise<void> => {
  const normalized = normalizeSession(session);

  if (!normalized) {
    console.error("Invalid session; it was not saved:", session);
    return;
  }

  try {
    const sessions = getSessions();
    const updated = [
      normalized,
      ...sessions.filter((item) => item.id !== normalized.id),
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving session locally:", error);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    console.log("Focus session synced with the backend.");
  } catch (error) {
    console.error("Backend sync failed:", error);
  }
};

export const syncSessionsFromBackend =
  async (): Promise<FocusSessionData[]> => {
    const response = await fetch(`${API_BASE_URL}/sessions`);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data: unknown = await response.json();

    let rawSessions: unknown[];

    if (Array.isArray(data)) {
      rawSessions = data;
    } else if (isRecord(data) && Array.isArray(data.sessions)) {
      rawSessions = data.sessions;
    } else {
      throw new Error("The sessions API returned an unexpected response.");
    }

    const remoteSessions = rawSessions
      .map(normalizeSession)
      .filter(
        (session): session is FocusSessionData => session !== null
      );

    console.log("Sessions returned by API:", rawSessions.length);
    console.log("Valid cloud sessions:", remoteSessions.length);

    const sessionsById = new Map<string, FocusSessionData>();

    getSessions().forEach((session) => {
      sessionsById.set(session.id, session);
    });

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

    console.log("Total sessions after merge:", mergedSessions.length);

    return mergedSessions;
  };

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

export const clearSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing sessions:", error);
  }
};
