import {
  ArrowUpRight,
  Brain,
  CalendarDays,
  Clock3,
  Flame,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppContext } from "../context/AppContext";
import { getSessions } from "../services/sessionStorage";
import type { FocusSessionData } from "../types/session";

function Dashboard() {
  const navigate = useNavigate();
  const { selectedSoundscape } = useAppContext();

  const [sessions, setSessions] = useState<FocusSessionData[]>([]);

  useEffect(() => {
    const loadSessions = () => {
      setSessions(getSessions());
    };

    loadSessions();

    window.addEventListener("storage", loadSessions);

    return () => {
      window.removeEventListener("storage", loadSessions);
    };
  }, []);

  const totalFocusSeconds = sessions.reduce(
    (total, session) => total + session.duration,
    0
  );

  const totalSessions = sessions.length;

  const averageFocus =
    totalSessions > 0
      ? Math.round(
          sessions.reduce(
            (total, session) => total + session.focusScore,
            0
          ) / totalSessions
        )
      : 0;

  const totalDriftEvents = sessions.reduce(
    (total, session) => total + session.driftEvents,
    0
  );

  const deepFocusSeconds = sessions
    .filter((session) => session.focusState === "DEEP_FOCUS")
    .reduce(
      (total, session) => total + session.duration,
      0
    );

  const averageWpm =
    totalSessions > 0
      ? Math.round(
          sessions.reduce(
            (total, session) => total + session.averageWpm,
            0
          ) / totalSessions
        )
      : 0;

  const recentSessions = sessions.slice(0, 5);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${remainingSeconds}s`;
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
      date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Today, ${time}`;
    }

    if (isYesterday) {
      return `Yesterday, ${time}`;
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatFocusState = (state: string) => {
    return state
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  };

  const getTodayFocusSeconds = () => {
    const today = new Date().toDateString();

    return sessions
      .filter(
        (session) =>
          new Date(session.date).toDateString() ===
          today
      )
      .reduce(
        (total, session) =>
          total + session.duration,
        0
      );
  };

  const todayFocusSeconds =
    getTodayFocusSeconds();

  const stats = [
    {
      label: "Focus Score",
      value: averageFocus.toString(),
      suffix: "%",
      change:
        totalSessions > 0
          ? "Real data"
          : "No sessions yet",
      icon: Brain,
      description: "Average across saved sessions",
    },
    {
      label: "Today's Focus",
      value:
        todayFocusSeconds >= 3600
          ? `${Math.floor(
              todayFocusSeconds / 3600
            )}h`
          : `${Math.floor(
              todayFocusSeconds / 60
            )}`,
      suffix:
        todayFocusSeconds >= 3600
          ? ` ${Math.floor(
              (todayFocusSeconds % 3600) / 60
            )}m`
          : todayFocusSeconds > 0
          ? " min"
          : " min",
      change:
        todayFocusSeconds > 0
          ? "Tracked today"
          : "Start focusing",
      icon: Clock3,
      description: "Focus time recorded today",
    },
    {
      label: "Average WPM",
      value: averageWpm.toString(),
      suffix: "",
      change:
        totalSessions > 0
          ? "Typing telemetry"
          : "Waiting",
      icon: Flame,
      description: "Average typing speed",
    },
    {
      label: "Sessions",
      value: totalSessions.toString(),
      suffix: "",
      change:
        totalSessions > 0
          ? `${totalSessions} saved`
          : "No sessions yet",
      icon: Target,
      description: "Completed focus sessions",
    },
  ];

  const chartSessions = sessions
    .slice(0, 12)
    .reverse();

  const chartData =
    chartSessions.length > 0
      ? chartSessions.map(
          (session) => session.focusScore
        )
      : [0, 0, 0, 0, 0, 0, 0];

  const aiInsight =
    totalSessions === 0
      ? "Start your first focus session. AuraVibe will analyse your typing rhythm and build insights from your real session data."
      : averageFocus >= 85
      ? "Your recent sessions show excellent focus consistency. Continue using your current working rhythm to maintain deep focus."
      : averageFocus >= 65
      ? "Your sessions show a stable focus pattern. Longer uninterrupted work blocks may help improve your focus consistency further."
      : totalDriftEvents > totalSessions
      ? "Your sessions show frequent attention drift. Try using a calmer soundscape and shorter uninterrupted focus blocks."
      : "Your focus pattern shows some fluctuations. AuraVibe recommends a calmer sound environment and fewer interruptions.";

  return (
    <div className="pb-10">
      {/* HEADER */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-violet-300">
            <Sparkles size={16} />
            <span>YOUR FOCUS OVERVIEW</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {getGreeting()} 👋
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 md:text-base">
            {totalSessions === 0
              ? "Start a session and AuraVibe will begin tracking your working rhythm in real time."
              : `You have completed ${totalSessions} focus session${
                  totalSessions === 1 ? "" : "s"
                }. Here is your real focus performance data.`}
          </p>
        </div>

        <button
          onClick={() => navigate("/focus")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:-translate-y-0.5 hover:shadow-violet-700/30"
        >
          <Play size={17} fill="currentColor" />
          Start Focus Session
        </button>
      </section>

      {/* STATS */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    {stat.label}
                  </p>

                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold text-white">
                      {stat.value}
                    </span>

                    <span className="mb-1 text-sm text-slate-500">
                      {stat.suffix}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-violet-500/15 bg-violet-500/10 p-3 text-violet-300">
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {stat.description}
                </span>

                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <TrendingUp size={13} />
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* MAIN GRID */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* FOCUS OVERVIEW */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
                REAL SESSION DATA
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Focus overview
              </h2>
            </div>

            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
            >
              View analytics
              <ArrowUpRight size={16} />
            </button>
          </div>

          {/* CHART */}
          <div className="mt-8 flex h-52 items-end justify-between gap-3 border-b border-white/[0.06] px-2 pb-3">
            {chartData.map((height, index) => (
              <div
                key={index}
                className="group flex flex-1 flex-col items-center justify-end"
              >
                <div
                  style={{
                    height: `${
                      height === 0
                        ? 3
                        : Math.max(height, 8)
                    }%`,
                  }}
                  title={`${height}% focus score`}
                  className="w-full max-w-8 rounded-t-xl bg-gradient-to-t from-violet-700/60 to-violet-400 transition-all duration-500 group-hover:from-violet-600 group-hover:to-violet-300"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-xs text-slate-500">
            <span>Earlier</span>
            <span>Recent sessions</span>
            <span>Latest</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniMetric
              label="Average focus"
              value={`${averageFocus}%`}
            />

            <MiniMetric
              label="Deep focus"
              value={formatDuration(
                deepFocusSeconds
              )}
            />

            <MiniMetric
              label="Drift events"
              value={totalDriftEvents.toString()}
            />
          </div>
        </div>

        {/* AI INSIGHT */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.12] via-[#111529] to-[#0d1120] p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
                <Sparkles size={21} />
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-violet-300">
                  AURA AI INSIGHT
                </p>

                <h2 className="mt-1 font-semibold text-white">
                  {totalSessions === 0
                    ? "Ready to analyse"
                    : averageFocus >= 85
                    ? "Strong focus detected"
                    : "Adaptive focus guidance"}
                </h2>
              </div>
            </div>

            <p className="mt-6 leading-7 text-slate-400">
              {aiInsight}
            </p>

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Waves size={20} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Active soundscape
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedSoundscape || "Soft Ambient"} ·
                    Adaptive mode
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate("/soundscapes")
                }
                className="mt-5 w-full rounded-xl border border-violet-400/20 bg-violet-500/10 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
              >
                Explore Soundscapes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT SESSIONS */}
      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
              YOUR ACTIVITY
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Recent sessions
            </h2>
          </div>

          <button
            onClick={() => navigate("/sessions")}
            className="flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
          >
            View all
            <ArrowUpRight size={16} />
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <Brain
              className="mx-auto text-violet-300"
              size={30}
            />

            <h3 className="mt-4 font-medium text-white">
              No sessions recorded yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Complete a focus session and your real
              data will appear here.
            </p>

            <button
              onClick={() => navigate("/focus")}
              className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Start your first session
            </button>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] border-b border-white/[0.06] px-4 pb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                <span>Session</span>
                <span>Duration</span>
                <span>Focus</span>
                <span>Status</span>
              </div>

              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] items-center border-b border-white/[0.04] px-4 py-5 last:border-none"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {session.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatSessionDate(
                        session.date
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock3 size={15} />
                    {formatDuration(
                      session.duration
                    )}
                  </div>

                  <div className="font-semibold text-white">
                    {session.focusScore}%
                  </div>

                  <div>
                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                      {formatFocusState(
                        session.focusState
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <section className="mt-6 flex flex-wrap items-center gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <CalendarDays size={14} />
          {totalSessions} session
          {totalSessions === 1 ? "" : "s"} stored
        </span>

        <span className="flex items-center gap-2">
          <Clock3 size={14} />
          {formatDuration(totalFocusSeconds)} total focus time
        </span>

        <span className="flex items-center gap-2">
          <Brain size={14} />
          Real-time telemetry engine enabled
        </span>
      </section>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/10 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

export default Dashboard;