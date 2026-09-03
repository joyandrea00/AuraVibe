import { createContext, useContext, useEffect, useState } from "react";

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
  duration: number;
  focusScore: number;
  averageWpm: number;
  consistency: number;
  driftEvents: number;
  focusState: FocusState;
  soundscape: string;
}

interface AppContextType {
  sessions: FocusSessionData[];
  addSession: (session: FocusSessionData) => void;
  selectedSoundscape: string;
  setSelectedSoundscape: (soundscape: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "auravibe_sessions";
const SOUNDSCAPE_KEY = "auravibe_soundscape";

export function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessions, setSessions] = useState<FocusSessionData[]>(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);

    return savedSessions ? JSON.parse(savedSessions) : [];
  });

  const [selectedSoundscape, setSelectedSoundscape] = useState(() => {
    return localStorage.getItem(SOUNDSCAPE_KEY) || "Brown Noise";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(SOUNDSCAPE_KEY, selectedSoundscape);
  }, [selectedSoundscape]);

  const addSession = (session: FocusSessionData) => {
    setSessions((previousSessions) => [
      session,
      ...previousSessions,
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        sessions,
        addSession,
        selectedSoundscape,
        setSelectedSoundscape,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppProvider"
    );
  }

  return context;
}