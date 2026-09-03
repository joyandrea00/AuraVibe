import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Clock3,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { getSessions, deleteSession, clearSessions } from "../services/sessionStorage";
import type { FocusSessionData } from "../types/session";

type SortOption = "newest" | "highest-focus" | "longest";

function Sessions() {
  const [sessions, setSessions] = useState<FocusSessionData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedSession, setSelectedSession] =
    useState<FocusSessionData | null>(null);

  useEffect(() => {
    loadSessions();

    const handleStorageChange = () => {
      loadSessions();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loadSessions = () => {
    setSessions(getSessions());
  };

  const handleDeleteSession = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session?"
    );

    if (!confirmed) return;

    deleteSession(id);
    loadSessions();
    setSelectedSession(null);
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all session history? This cannot be undone."
    );

    if (!confirmed) return;

    clearSessions();
    loadSessions();
    setSelectedSession(null);
  };

  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter((session) =>
      session.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "highest-focus") {
        return b.focusScore - a.focusScore;
      }

      if (sortBy === "longest") {
        return b.duration - a.duration;
      }

      return (
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
      );
    });
  }, [sessions, searchQuery, sortBy]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;

    return `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatState = (state: string) =>
    state
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="pb-10">
      {/* HEADER */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <Sparkles size={16} />
            SESSION INTELLIGENCE
          </div>

          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Session History
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Review your completed focus sessions and explore your
            individual performance patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            <span className="font-semibold text-white">
              {sessions.length}
            </span>{" "}
            sessions recorded
          </div>
        </div>
      </section>

      {/* SEARCH + SORT */}
      <section className="mt-8 flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4">
          <Search size={18} className="text-slate-500" />

          <input
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search sessions..."
            className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4">
          <SlidersHorizontal
            size={17}
            className="text-violet-300"
          />

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as SortOption)
            }
            className="bg-transparent py-3 text-sm text-slate-300 outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="highest-focus">
              Highest focus
            </option>
            <option value="longest">
              Longest session
            </option>
          </select>
        </div>
      </section>

      {/* EMPTY STATE */}
      {filteredSessions.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
          <Brain
            className="mx-auto text-violet-300"
            size={40}
          />

          <h2 className="mt-5 text-xl font-semibold text-white">
            {sessions.length === 0
              ? "No sessions yet"
              : "No matching sessions"}
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {sessions.length === 0
              ? "Complete a Focus Session to start building your history."
              : "Try a different search term."}
          </p>
        </section>
      ) : (
        /* SESSION LIST */
        <section className="mt-6 grid gap-4">
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="group w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
                    <Brain size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-white">
                      {session.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(session.date)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 sm:flex sm:items-center sm:gap-8">
                  <SessionStat
                    label="Focus"
                    value={`${session.focusScore}%`}
                  />

                  <SessionStat
                    label="Duration"
                    value={formatDuration(session.duration)}
                  />

                  <SessionStat
                    label="WPM"
                    value={session.averageWpm.toString()}
                  />

                  <div className="hidden sm:block">
                    <ArrowUpRight
                      size={20}
                      className="text-slate-500 transition group-hover:text-violet-300"
                    />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* SESSION DETAIL MODAL */}
      {selectedSession && (
        <SessionDetails
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onDelete={handleDeleteSession}
          formatDuration={formatDuration}
          formatDate={formatDate}
          formatState={formatState}
        />
      )}
    </div>
  );
}

function SessionStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function SessionDetails({
  session,
  onClose,
  onDelete,
  formatDuration,
  formatDate,
  formatState,
}: {
  session: FocusSessionData;
  onClose: () => void;
  onDelete: (id: string) => void;
  formatDuration: (seconds: number) => string;
  formatDate: (date: string) => string;
  formatState: (state: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#101421] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
              SESSION REPORT
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {session.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {formatDate(session.date)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <DetailCard
            icon={<Brain size={19} />}
            label="Focus Score"
            value={`${session.focusScore}%`}
          />

          <DetailCard
            icon={<Clock3 size={19} />}
            label="Session Duration"
            value={formatDuration(session.duration)}
          />

          <DetailCard
            icon={<Activity size={19} />}
            label="Average WPM"
            value={session.averageWpm.toString()}
          />

          <DetailCard
            icon={<Target size={19} />}
            label="Consistency"
            value={`${session.consistency}%`}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-violet-300">
            BEHAVIOUR SUMMARY
          </p>

          <div className="mt-5 space-y-4">
            <DetailRow
              label="Final focus state"
              value={formatState(session.focusState)}
            />

            <DetailRow
              label="Attention drift events"
              value={session.driftEvents.toString()}
            />

            <DetailRow
              label="Adaptive soundscape"
              value={session.soundscape}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-violet-200">
            <Sparkles size={17} />
            AuraVibe insight
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {getSessionInsight(session)}
          </p>
        </div>

        <button
          onClick={() => onDelete(session.id)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
        >
          <Trash2 size={17} />
          Delete This Session
        </button>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300">
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-lg font-semibold text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] pb-4 last:border-none last:pb-0">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-slate-200">
        {value}
      </span>
    </div>
  );
}

function getSessionInsight(session: FocusSessionData) {
  if (
    session.focusScore >= 85 &&
    session.consistency >= 70
  ) {
    return "This was a strong session with stable typing behaviour and high focus. Your current work rhythm appears well suited for sustained concentration.";
  }

  if (session.driftEvents >= 2) {
    return "Multiple attention drift events were detected during this session. A shorter focus block or stronger adaptive sound intervention may help maintain engagement.";
  }

  if (session.focusScore >= 65) {
    return "This session showed a reasonably stable focus pattern. Maintaining consistent work intervals may help improve your performance further.";
  }

  return "Your working rhythm showed noticeable variation during this session. AuraVibe can use additional sessions to better understand your personal focus pattern.";
}

export default Sessions;