import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  Clock3,
  Flame,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

import type { FocusSessionData } from "../types/session";
import {
  clearSessions,
  getSessions,
} from "../services/sessionStorage";

function Analytics() {
  const [sessions, setSessions] = useState<FocusSessionData[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    setSessions(getSessions());
  };

  const handleClearSessions = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all analytics and session history? This cannot be undone."
    );

    if (!confirmed) return;

    clearSessions();
    setSessions([]);
  };

  const analytics = useMemo(() => {
    const totalSessions = sessions.length;

    const totalFocusSeconds = sessions.reduce(
      (total, session) => total + session.duration,
      0
    );

    const averageFocus =
      totalSessions > 0
        ? Math.round(
            sessions.reduce(
              (total, session) => total + session.focusScore,
              0
            ) / totalSessions
          )
        : 0;

    const averageWpm =
      totalSessions > 0
        ? Math.round(
            sessions.reduce(
              (total, session) => total + session.averageWpm,
              0
            ) / totalSessions
          )
        : 0;

    const averageConsistency =
      totalSessions > 0
        ? Math.round(
            sessions.reduce(
              (total, session) =>
                total + session.consistency,
              0
            ) / totalSessions
          )
        : 0;

    const totalDriftEvents = sessions.reduce(
      (total, session) => total + session.driftEvents,
      0
    );

    const deepFocusSessions = sessions.filter(
      (session) =>
        session.focusState === "DEEP_FOCUS"
    ).length;

    const bestFocus =
      totalSessions > 0
        ? Math.max(
            ...sessions.map(
              (session) => session.focusScore
            )
          )
        : 0;

    const latestSession =
      totalSessions > 0 ? sessions[0] : null;

    return {
      totalSessions,
      totalFocusSeconds,
      averageFocus,
      averageWpm,
      averageConsistency,
      totalDriftEvents,
      deepFocusSessions,
      bestFocus,
      latestSession,
    };
  }, [sessions]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(
      (seconds % 3600) / 60
    );
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  };

  const chartSessions = [...sessions]
    .slice(0, 10)
    .reverse();

  const chartData =
    chartSessions.length > 0
      ? chartSessions.map((session) => ({
          focus: session.focusScore,
          consistency: session.consistency,
        }))
      : [];

  const focusTrend =
    sessions.length >= 2
      ? sessions[0].focusScore -
        sessions[1].focusScore
      : 0;

  const getInsight = () => {
    if (analytics.totalSessions === 0) {
      return "Complete your first focus session to unlock personalised analytics. AuraVibe will analyse your focus score, typing rhythm, consistency and attention drift.";
    }

    if (analytics.averageFocus >= 85) {
      return "Your overall focus performance is excellent. Your recent sessions show a strong ability to maintain concentration over time.";
    }

    if (analytics.averageFocus >= 70) {
      return "Your focus pattern is stable and improving. Try maintaining longer uninterrupted work sessions to build even stronger consistency.";
    }

    if (analytics.totalDriftEvents >= 3) {
      return "Your analytics show multiple attention drift events. Consider shorter focus blocks and use your adaptive soundscape to create a more consistent environment.";
    }

    return "Your focus pattern is still developing. Continue completing sessions so AuraVibe can build a clearer understanding of your personal working rhythm.";
  };

  return (
    <div className="pb-10">
      {/* HEADER */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <Sparkles size={16} />
            PERFORMANCE INTELLIGENCE
          </div>

          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Focus Analytics
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Understand your focus behaviour through real session
            data, typing patterns and attention consistency.
          </p>
        </div>

        {analytics.totalSessions > 0 && (
          <button
            onClick={handleClearSessions}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
          >
            <Trash2 size={16} />
            Clear Analytics
          </button>
        )}
      </section>

      {/* TOP STATS */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          label="Average Focus"
          value={`${analytics.averageFocus}%`}
          description="Across all sessions"
          icon={<Brain size={21} />}
        />

        <AnalyticsCard
          label="Focus Time"
          value={formatDuration(
            analytics.totalFocusSeconds
          )}
          description="Total recorded time"
          icon={<Clock3 size={21} />}
        />

        <AnalyticsCard
          label="Average WPM"
          value={analytics.averageWpm.toString()}
          description="Typing rhythm"
          icon={<Flame size={21} />}
        />

        <AnalyticsCard
          label="Consistency"
          value={`${analytics.averageConsistency}%`}
          description="Focus stability"
          icon={<Target size={21} />}
        />
      </section>

      {/* MAIN ANALYTICS */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* FOCUS TREND */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
                FOCUS TREND
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Session performance
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your focus score across recent sessions.
              </p>
            </div>

            {analytics.totalSessions >= 2 && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  focusTrend >= 0
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-red-400/10 text-red-300"
                }`}
              >
                {focusTrend >= 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}

                {Math.abs(focusTrend)}% from previous
              </div>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="mt-8 flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10">
              <div className="text-center">
                <Activity
                  size={32}
                  className="mx-auto text-violet-300"
                />

                <p className="mt-4 font-medium text-white">
                  No focus data yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Complete sessions to see your performance trend.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8 flex h-64 items-end gap-3 border-b border-white/[0.06] px-2 pb-4">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="group flex h-full flex-1 flex-col justify-end"
                  >
                    <div className="mb-2 text-center text-xs text-slate-500 opacity-0 transition group-hover:opacity-100">
                      {data.focus}%
                    </div>

                    <div
                      title={`Focus: ${data.focus}%`}
                      style={{
                        height: `${Math.max(
                          data.focus,
                          5
                        )}%`,
                      }}
                      className="w-full rounded-t-xl bg-gradient-to-t from-violet-700/70 to-violet-400 transition-all duration-500 group-hover:from-violet-600 group-hover:to-violet-300"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between text-xs text-slate-500">
                <span>Earlier sessions</span>
                <span>Latest sessions</span>
              </div>
            </>
          )}
        </div>

        {/* PERFORMANCE SUMMARY */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
            PERFORMANCE SUMMARY
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Your focus profile
          </h2>

          <div className="mt-7 space-y-4">
            <SummaryRow
              icon={<Brain size={18} />}
              label="Best focus score"
              value={`${analytics.bestFocus}%`}
            />

            <SummaryRow
              icon={<Target size={18} />}
              label="Deep focus sessions"
              value={`${analytics.deepFocusSessions}`}
            />

            <SummaryRow
              icon={<Activity size={18} />}
              label="Attention drift events"
              value={`${analytics.totalDriftEvents}`}
            />

            <SummaryRow
              icon={<Clock3 size={18} />}
              label="Sessions completed"
              value={`${analytics.totalSessions}`}
            />
          </div>

          {analytics.latestSession && (
            <div className="mt-6 rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300">
                  <Waves size={19} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Latest soundscape
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {analytics.latestSession.soundscape}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI INSIGHT */}
      <section className="relative mt-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.12] via-[#121628] to-[#0d1120] p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Sparkles size={22} />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
              AURAVIBE INTELLIGENCE
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Personalised focus insight
            </h2>

            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              {getInsight()}
            </p>
          </div>
        </div>
      </section>

      {/* SESSION BREAKDOWN */}
      {sessions.length > 0 && (
        <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
              SESSION BREAKDOWN
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Recent performance
            </h2>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] border-b border-white/[0.06] px-4 pb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                <span>Session</span>
                <span>Focus</span>
                <span>Duration</span>
                <span>WPM</span>
                <span>Consistency</span>
              </div>

              {sessions.slice(0, 8).map((session) => (
                <div
                  key={session.id}
                  className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center border-b border-white/[0.04] px-4 py-5 last:border-none"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {session.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(
                        session.date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="font-semibold text-white">
                    {session.focusScore}%
                  </span>

                  <span className="text-sm text-slate-400">
                    {formatDuration(session.duration)}
                  </span>

                  <span className="text-sm text-slate-400">
                    {session.averageWpm}
                  </span>

                  <span className="text-sm text-violet-300">
                    {session.consistency}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="rounded-xl border border-violet-500/15 bg-violet-500/10 p-3 text-violet-300">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/10 p-4">
      <div className="flex items-center gap-3">
        <div className="text-violet-300">
          {icon}
        </div>

        <span className="text-sm text-slate-400">
          {label}
        </span>
      </div>

      <span className="font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

export default Analytics;