import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Brain,
  CirclePause,
  Clock3,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Waves,
} from "lucide-react";

import { useTelemetry } from "../hooks/useTelemetry";
import {
  calculateFocusScore,
  determineFocusState,
  type FocusState,
} from "../utils/focusCalculator";
import { getAdaptiveSoundscape } from "../utils/soundEngine";
import { audioEngine } from "../services/audioEngine";
import { useAppContext } from "../context/AppContext";
import type {
  FocusSessionData,
  FocusState as StoredFocusState,
} from "../types/session";
import { saveSession } from "../services/sessionStorage";

type AppPreferences = {
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
};

type TimerMode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
type SessionStatus = "READY" | "RUNNING" | "PAUSED" | "ENDED";

const DEFAULT_PREFERENCES: AppPreferences = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  soundEnabled: true,
  notificationsEnabled: false,
};

function readPreferences(): AppPreferences {
  try {
    const saved = localStorage.getItem("auravibe-settings");
    if (!saved) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      focusDuration:
        Number(parsed.focusDuration) > 0
          ? Number(parsed.focusDuration)
          : DEFAULT_PREFERENCES.focusDuration,
      shortBreak:
        Number(parsed.shortBreak) > 0
          ? Number(parsed.shortBreak)
          : DEFAULT_PREFERENCES.shortBreak,
      longBreak:
        Number(parsed.longBreak) > 0
          ? Number(parsed.longBreak)
          : DEFAULT_PREFERENCES.longBreak,
      soundEnabled:
        typeof parsed.soundEnabled === "boolean"
          ? parsed.soundEnabled
          : DEFAULT_PREFERENCES.soundEnabled,
      notificationsEnabled:
        typeof parsed.notificationsEnabled === "boolean"
          ? parsed.notificationsEnabled
          : DEFAULT_PREFERENCES.notificationsEnabled,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function FocusSession() {
  const {
    addSession,
    selectedSoundscape,
    setSelectedSoundscape,
  } = useAppContext();

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("READY");
  const [timerMode, setTimerMode] = useState<TimerMode>("FOCUS");
  const [sessionTitle, setSessionTitle] =
    useState("Deep Work Session");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState(0);
  const [text, setText] = useState("");
  const [driftEvents, setDriftEvents] = useState(0);
  const [preferences, setPreferences] =
    useState<AppPreferences>(readPreferences);

  const driftDetectedRef = useRef(false);
  const sessionStartedAtRef = useRef<Date | null>(null);
  const wpmSamplesRef = useRef<number[]>([]);
  const consistencySamplesRef = useRef<number[]>([]);
  const focusStateCountsRef = useRef<Record<StoredFocusState, number>>({
    CALIBRATING: 0,
    FOCUSED: 0,
    DEEP_FOCUS: 0,
    UNSTABLE: 0,
    ATTENTION_DRIFT: 0,
    IDLE: 0,
  });
  const lastTrackedSecondRef = useRef(-1);

  const isRunning = sessionStatus === "RUNNING";
  const isFocusMode = timerMode === "FOCUS";
  const focusDurationSeconds = preferences.focusDuration * 60;

  const isFocusComplete =
    isFocusMode && elapsedSeconds >= focusDurationSeconds;
  const isBreakComplete =
    !isFocusMode && breakSecondsRemaining <= 0;
  const isTimerComplete = isFocusMode
    ? isFocusComplete
    : isBreakComplete;

  const {
    telemetry,
    registerKeystroke,
    resetTelemetry,
  } = useTelemetry(isRunning && isFocusMode);

  useEffect(() => {
    const syncPreferences = () => setPreferences(readPreferences());

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "auravibe-settings" ||
        event.key === null
      ) {
        syncPreferences();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      "auravibe-settings-updated",
      syncPreferences
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "auravibe-settings-updated",
        syncPreferences
      );
    };
  }, []);

  useEffect(() => {
    if (!isRunning || isTimerComplete) return;

    const timer = window.setInterval(() => {
      if (isFocusMode) {
        setElapsedSeconds((seconds) =>
          Math.min(seconds + 1, focusDurationSeconds)
        );
      } else {
        setBreakSecondsRemaining((seconds) =>
          Math.max(seconds - 1, 0)
        );
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    isRunning,
    isFocusMode,
    isTimerComplete,
    focusDurationSeconds,
  ]);

  useEffect(() => {
    if (isRunning && isTimerComplete) {
      audioEngine.stop();
      setSessionStatus("PAUSED");
    }
  }, [isRunning, isTimerComplete]);

  const focusScore = useMemo(() => {
    if (sessionStatus === "READY" || !isFocusMode) return 0;

    return calculateFocusScore({
      wpm: telemetry.wpm,
      consistency: telemetry.consistency,
      pauseDuration: telemetry.pauseDuration,
    });
  }, [
    telemetry.wpm,
    telemetry.consistency,
    telemetry.pauseDuration,
    sessionStatus,
    isFocusMode,
  ]);

  const focusState: FocusState = useMemo(() => {
    if (
      sessionStatus === "READY" ||
      sessionStatus === "ENDED" ||
      !isFocusMode
    ) {
      return "CALIBRATING";
    }

    return determineFocusState(
      focusScore,
      telemetry.pauseDuration
    );
  }, [
    focusScore,
    telemetry.pauseDuration,
    sessionStatus,
    isFocusMode,
  ]);

  const adaptiveSound = useMemo(
    () =>
      getAdaptiveSoundscape(
        focusState,
        telemetry.wpm,
        telemetry.consistency
      ),
    [focusState, telemetry.wpm, telemetry.consistency]
  );

  useEffect(() => {
    if (!isRunning || !isFocusMode) return;

    if (selectedSoundscape !== adaptiveSound.name) {
      setSelectedSoundscape(adaptiveSound.name);
    }
  }, [
    isRunning,
    isFocusMode,
    adaptiveSound.name,
    selectedSoundscape,
    setSelectedSoundscape,
  ]);

  useEffect(() => {
    if (
      !isRunning ||
      !isFocusMode ||
      !preferences.soundEnabled
    ) {
      audioEngine.stop();
      return;
    }

    void audioEngine.play(
      adaptiveSound.name,
      adaptiveSound.intensity
    );

    return () => audioEngine.stop();
  }, [
    isRunning,
    isFocusMode,
    preferences.soundEnabled,
    adaptiveSound.name,
    adaptiveSound.intensity,
  ]);

  useEffect(() => {
    if (
      !isRunning ||
      !isFocusMode ||
      elapsedSeconds === 0 ||
      lastTrackedSecondRef.current === elapsedSeconds
    ) {
      return;
    }

    lastTrackedSecondRef.current = elapsedSeconds;
    wpmSamplesRef.current.push(telemetry.wpm);
    consistencySamplesRef.current.push(telemetry.consistency);
    focusStateCountsRef.current[focusState as StoredFocusState] += 1;
  }, [
    isRunning,
    isFocusMode,
    elapsedSeconds,
    telemetry.wpm,
    telemetry.consistency,
    focusState,
  ]);

  useEffect(() => {
    if (!isFocusMode) {
      driftDetectedRef.current = false;
      return;
    }

    const isDrifting =
      focusState === "ATTENTION_DRIFT" ||
      focusState === "IDLE";

    if (isDrifting && !driftDetectedRef.current) {
      setDriftEvents((events) => events + 1);
      driftDetectedRef.current = true;
    }

    if (!isDrifting) {
      driftDetectedRef.current = false;
    }
  }, [focusState, isFocusMode]);

  const resetAnalytics = () => {
    wpmSamplesRef.current = [];
    consistencySamplesRef.current = [];
    focusStateCountsRef.current = {
      CALIBRATING: 0,
      FOCUSED: 0,
      DEEP_FOCUS: 0,
      UNSTABLE: 0,
      ATTENTION_DRIFT: 0,
      IDLE: 0,
    };
    lastTrackedSecondRef.current = -1;
  };

  const startSession = () => {
    if (sessionStatus === "PAUSED") {
      if (isTimerComplete) {
        setSessionStatus("ENDED");
        audioEngine.stop();
        return;
      }

      setSessionStatus("RUNNING");
      return;
    }

    if (
      sessionStatus === "READY" ||
      sessionStatus === "ENDED"
    ) {
      audioEngine.stop();
      resetTelemetry();

      setTimerMode("FOCUS");
      setElapsedSeconds(0);
      setBreakSecondsRemaining(0);
      setText("");
      setDriftEvents(0);

      driftDetectedRef.current = false;
      sessionStartedAtRef.current = new Date();
      resetAnalytics();
      setSessionStatus("RUNNING");
    }
  };

  const startBreak = (mode: "SHORT_BREAK" | "LONG_BREAK") => {
    audioEngine.stop();

    const duration =
      mode === "SHORT_BREAK"
        ? preferences.shortBreak
        : preferences.longBreak;

    setTimerMode(mode);
    setBreakSecondsRemaining(duration * 60);
    setSessionStatus("RUNNING");
  };

  const pauseSession = () => {
    if (sessionStatus === "RUNNING") {
      setSessionStatus("PAUSED");
      audioEngine.stop();
    }
  };

  const endSession = () => {
    if (!isFocusMode) {
      audioEngine.stop();
      setSessionStatus("ENDED");
      setTimerMode("FOCUS");
      setBreakSecondsRemaining(0);
      return;
    }

    if (elapsedSeconds === 0) {
      audioEngine.stop();
      setSessionStatus("ENDED");
      return;
    }

    const endTime = new Date();
    const startTime = sessionStartedAtRef.current ?? endTime;

    const averageWpm =
      wpmSamplesRef.current.length > 0
        ? Math.round(
            wpmSamplesRef.current.reduce(
              (total, value) => total + value,
              0
            ) / wpmSamplesRef.current.length
          )
        : telemetry.wpm;

    const averageConsistency =
      consistencySamplesRef.current.length > 0
        ? Math.round(
            consistencySamplesRef.current.reduce(
              (total, value) => total + value,
              0
            ) / consistencySamplesRef.current.length
          )
        : telemetry.consistency;

    const distribution = { ...focusStateCountsRef.current };

    const dominantFocusState = (
      Object.entries(distribution) as [
        StoredFocusState,
        number
      ][]
    ).reduce(
      (dominant, current) =>
        current[1] > dominant[1] ? current : dominant,
      ["CALIBRATING", -1] as [StoredFocusState, number]
    )[0];

    const storedSession: FocusSessionData = {
      id: crypto.randomUUID(),
      title: sessionTitle.trim() || "Untitled Focus Session",
      date: endTime.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: elapsedSeconds,
      focusScore,
      averageWpm,
      consistency: averageConsistency,
      averageConsistency,
      driftEvents,
      focusState: focusState as StoredFocusState,
      dominantFocusState,
      focusStateDistribution: distribution,
      soundscape: adaptiveSound.name,
    };

    saveSession(storedSession);
    addSession(storedSession);

    audioEngine.stop();
    setSessionStatus("ENDED");
  };

  const resetSession = () => {
    audioEngine.stop();
    resetTelemetry();

    setTimerMode("FOCUS");
    setElapsedSeconds(0);
    setBreakSecondsRemaining(0);
    setText("");
    setDriftEvents(0);

    driftDetectedRef.current = false;
    sessionStartedAtRef.current = null;
    resetAnalytics();
    setSessionStatus("READY");
  };

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  const displayedTime = isFocusMode
    ? formatTime(Math.max(0, focusDurationSeconds - elapsedSeconds))
    : formatTime(breakSecondsRemaining);

  const stateLabel = focusState
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="pb-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <Activity size={16} />
            REAL-TIME TELEMETRY
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">
            Focus Session
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            AuraVibe analyses your typing rhythm and adapts
            your focus environment in real time.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
            isRunning
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isRunning ? "animate-pulse bg-emerald-400" : "bg-slate-500"
            }`}
          />
          {timerMode === "FOCUS"
            ? sessionStatus
            : `${timerMode.replace("_", " ")} · ${sessionStatus}`}
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LiveMetric
          icon={<Brain size={20} />}
          label="Focus Score"
          value={`${focusScore}%`}
          detail={stateLabel}
        />
        <LiveMetric
          icon={<Activity size={20} />}
          label="Typing Speed"
          value={`${telemetry.wpm}`}
          detail="Words per minute"
        />
        <LiveMetric
          icon={<Clock3 size={20} />}
          label={isFocusMode ? "Focus Timer" : "Break Timer"}
          value={displayedTime}
          detail={
            isFocusMode
              ? `${telemetry.keyCount} keystrokes · ${preferences.focusDuration} min target`
              : `${timerMode === "SHORT_BREAK" ? "Short" : "Long"} break · ${
                  timerMode === "SHORT_BREAK"
                    ? preferences.shortBreak
                    : preferences.longBreak
                } min`
          }
        />
        <LiveMetric
          icon={<Sparkles size={20} />}
          label="Consistency"
          value={`${telemetry.consistency}%`}
          detail={`${telemetry.pauseDuration}s since last key`}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
                LIVE INPUT STREAM
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {isFocusMode
                  ? "Your workspace"
                  : timerMode === "SHORT_BREAK"
                    ? "Short break"
                    : "Long break"}
              </h2>
            </div>

            <input
              value={sessionTitle}
              onChange={(event) => setSessionTitle(event.target.value)}
              disabled={sessionStatus === "RUNNING"}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300 outline-none focus:border-violet-500 disabled:opacity-60"
            />
          </div>

          {isFocusMode ? (
            <textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                registerKeystroke();
              }}
              disabled={!isRunning}
              placeholder={
                isRunning
                  ? "Start typing here... AuraVibe is analysing your focus and adapting your environment in real time."
                  : "Click Start Session to activate your workspace."
              }
              className="mt-5 h-80 w-full resize-none rounded-2xl border border-white/[0.08] bg-[#070a14] p-5 text-sm leading-7 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 disabled:cursor-not-allowed disabled:opacity-60"
            />
          ) : (
            <div className="mt-5 flex h-80 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#070a14] p-8 text-center">
              <Clock3 size={42} className="text-emerald-300" />
              <h3 className="mt-5 text-2xl font-semibold text-white">
                Take a breath
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                Step away from your workspace, stretch, and rest your eyes.
                Your break timer will continue running.
              </p>
              <p className="mt-5 text-xs text-slate-500">
                Focus session data is not recorded during breaks.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!isRunning &&
              (sessionStatus === "READY" || sessionStatus === "ENDED") &&
              isFocusMode && (
                <button
                  onClick={startSession}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Play size={17} fill="currentColor" />
                  {sessionStatus === "ENDED" ? "Start New Session" : "Start Session"}
                </button>
              )}

            {sessionStatus === "PAUSED" && !isTimerComplete && (
              <button
                onClick={() => setSessionStatus("RUNNING")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white"
              >
                <Play size={17} fill="currentColor" />
                Resume {isFocusMode ? "Session" : "Break"}
              </button>
            )}

            {sessionStatus === "PAUSED" && isTimerComplete && isFocusMode && (
              <button
                onClick={endSession}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white"
              >
                <Square size={16} fill="currentColor" />
                Complete &amp; Save
              </button>
            )}

            {sessionStatus === "PAUSED" && isTimerComplete && !isFocusMode && (
              <button
                onClick={() => {
                  setTimerMode("FOCUS");
                  setBreakSecondsRemaining(0);
                  setElapsedSeconds(0);
                  setSessionStatus("READY");
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white"
              >
                <Play size={17} fill="currentColor" />
                Return to Focus
              </button>
            )}

            {isRunning && (
              <button
                onClick={pauseSession}
                className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-200"
              >
                <CirclePause size={17} />
                Pause
              </button>
            )}

            {isFocusMode &&
              (isRunning || sessionStatus === "PAUSED") &&
              !isFocusComplete && (
                <button
                  onClick={endSession}
                  className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200"
                >
                  <Square size={16} fill="currentColor" />
                  End &amp; Save
                </button>
              )}

            {!isFocusMode &&
              (isRunning || sessionStatus === "PAUSED") && (
                <button
                  onClick={() => {
                    audioEngine.stop();
                    setTimerMode("FOCUS");
                    setBreakSecondsRemaining(0);
                    setElapsedSeconds(0);
                    setSessionStatus("READY");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300"
                >
                  <Square size={16} />
                  End Break
                </button>
              )}

            <button
              onClick={resetSession}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            {!isRunning && (
              <>
                <button
                  onClick={() => startBreak("SHORT_BREAK")}
                  className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200"
                >
                  <Clock3 size={17} />
                  Short Break
                </button>
                <button
                  onClick={() => startBreak("LONG_BREAK")}
                  className="flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-200"
                >
                  <Clock3 size={17} />
                  Long Break
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.12] to-white/[0.02] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
              <Sparkles size={21} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-violet-300">
                ADAPTIVE ENGINE
              </p>
              <h2 className="mt-1 font-semibold text-white">
                Live focus analysis
              </h2>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-white/[0.07] bg-black/20 p-5">
            <p className="text-xs text-slate-500">CURRENT STATE</p>
            <h3 className="mt-3 text-2xl font-bold text-white">
              {isFocusMode ? stateLabel : "On Break"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {isFocusMode
                ? getFocusMessage(focusState)
                : "Your break is in progress. Relax before returning to your next focus session."}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <InfoRow label="Drift events" value={driftEvents.toString()} />
            <InfoRow label="Adaptive soundscape" value={adaptiveSound.name} />
          </div>

          <div className="mt-7 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5">
            <div className="flex items-center gap-2 text-violet-200">
              <Waves size={18} />
              <span className="font-medium">Now Playing</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              {adaptiveSound.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {adaptiveSound.description}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Adaptive intensity</span>
                <span className="font-semibold text-violet-200">
                  {Math.round(adaptiveSound.intensity * 100)}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  style={{ width: `${adaptiveSound.intensity * 100}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all duration-700"
                />
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              {!preferences.soundEnabled
                ? "Sound is disabled in Settings."
                : isRunning && isFocusMode
                  ? "Adaptive audio is enabled and responds to your live focus state."
                  : "Adaptive audio plays during active focus sessions."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function LiveMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

function getFocusMessage(state: FocusState) {
  const messages: Record<FocusState, string> = {
    CALIBRATING:
      "Collecting typing telemetry to understand your current working rhythm.",
    FOCUSED:
      "Your typing pattern is stable. AuraVibe is maintaining a balanced focus environment.",
    DEEP_FOCUS:
      "Excellent consistency detected. You are currently in a strong deep-focus zone.",
    UNSTABLE:
      "Your working rhythm is fluctuating. AuraVibe is recommending a more stabilising sound environment.",
    ATTENTION_DRIFT:
      "Extended pauses detected. AuraVibe is adapting your environment to support attention recovery.",
    IDLE:
      "No recent activity detected. Audio adaptation is reduced while your workspace is inactive.",
  };

  return messages[state];
}

export default FocusSession;