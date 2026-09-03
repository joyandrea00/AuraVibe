import type { FocusSessionData } from "../types/session";

const STORAGE_KEY = "auravibe_focus_sessions";

export const getSessions = (): FocusSessionData[] => {
  try {
    const storedSessions = localStorage.getItem(STORAGE_KEY);

    if (!storedSessions) {
      return [];
    }

    return JSON.parse(storedSessions);
  } catch (error) {
    console.error(
      "Error loading AuraVibe sessions:",
      error
    );

    return [];
  }
};

export const saveSession = (
  session: FocusSessionData
) => {
  try {
    const existingSessions = getSessions();

    const updatedSessions = [
      session,
      ...existingSessions,
    ];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedSessions)
    );
  } catch (error) {
    console.error(
      "Error saving AuraVibe session:",
      error
    );
  }
};

export const deleteSession = (id: string) => {
  try {
    const sessions = getSessions();

    const updatedSessions = sessions.filter(
      (session) => session.id !== id
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedSessions)
    );
  } catch (error) {
    console.error(
      "Error deleting AuraVibe session:",
      error
    );
  }
};

export const clearSessions = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(
      "Error clearing AuraVibe sessions:",
      error
    );
  }
};