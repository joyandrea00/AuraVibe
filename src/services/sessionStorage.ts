
import type { FocusSessionData } from "../types/session";

const STORAGE_KEY = "auravibe_focus_sessions";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Load locally cached sessions.
export const getSessions = (): FocusSessionData[] => {
  try {
    const storedSessions = localStorage.getItem(STORAGE_KEY);

    if (!storedSessions) return [];

    const parsed: unknown = JSON.parse(storedSessions);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading AuraVibe sessions:", error);
    return [];
  }
};

// Save locally first, then send the session to the backend.
export const saveSession = async (
  session: FocusSessionData
): Promise<void> => {
  try {
    const existingSessions = getSessions();

    const updatedSessions = [
      session,
      ...existingSessions.filter((item) => item.id !== session.id),
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error("Error saving AuraVibe session locally:", error);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    console.log("Focus session saved to AWS DynamoDB.");
  } catch (error) {
    console.error(
      "Could not sync session with the backend. The local copy is retained:",
      error
    );
  }
};

// Validate records before displaying them in the Sessions page.
const isCompleteSession = (
  value: unknown
): value is FocusSessionData => {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<FocusSessionData>;

  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    typeof session.date === "string" &&
    typeof session.duration === "number" &&
    typeof session.focusScore === "number" &&
    typeof session.averageWpm === "number" &&
    typeof session.consistency === "number" &&
    typeof session.averageConsistency === "number" &&
    typeof session.driftEvents === "number" &&
    typeof session.focusState === "string" &&
    typeof session.dominantFocusState === "string" &&
    typeof session.soundscape === "string" &&
    typeof session.focusStateDistribution === "object" &&
    session.focusStateDistribution !== null
  );
};

// Fetch sessions from the backend, merge with local history,
// and cache the merged results for offline use.
export const syncSessionsFromBackend =
  async (): Promise<FocusSessionData[]> => {
    const response = await fetch(`${API_BASE_URL}/sessions`);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data: { sessions?: unknown[] } = await response.json();

    const remoteSessions = Array.isArray(data.sessions)
      ? data.sessions.filter(isCompleteSession)
      : [];

    const localSessions = getSessions();
    const sessionsById = new Map<string, FocusSessionData>();

    // Keep local records first; cloud records replace duplicates.
    localSessions.forEach((session) => {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSessions));
    } catch (error) {
      console.error("Error caching synced AuraVibe sessions:", error);
    }

    return mergedSessions;
  };

// Delete a session from local history.
export const deleteSession = (id: string): void => {
  try {
    const updatedSessions = getSessions().filter(
      (session) => session.id !== id
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error("Error deleting AuraVibe session:", error);
  }
};

// Clear local session history.
export const clearSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing AuraVibe sessions:", error);
  }
};