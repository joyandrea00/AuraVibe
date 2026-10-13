
import { useEffect, useState } from "react";

type Preferences = {
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
};

const defaults: Preferences = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  soundEnabled: true,
  notificationsEnabled: false,
};

function Settings() {
  const [settings, setSettings] = useState<Preferences>(() => {
    try {
      const saved = localStorage.getItem("auravibe-settings");
      return saved
        ? { ...defaults, ...JSON.parse(saved) }
        : defaults;
    } catch {
      return defaults;
    }
  });

  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "auravibe-settings",
      JSON.stringify(settings)
    );
    setSavedMessage("Preferences saved");
    const timeout = window.setTimeout(
      () => setSavedMessage(""),
      2000
    );
    return () => window.clearTimeout(timeout);
  }, [settings]);

  function update<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Notifications are not supported by this browser.");
      return;
    }

    if (!settings.notificationsEnabled) {
      const permission = await Notification.requestPermission();
      update("notificationsEnabled", permission === "granted");
    } else {
      update("notificationsEnabled", false);
    }
  }

  function resetSettings() {
    setSettings(defaults);
  }

  const card =
    "rounded-2xl border border-white/10 bg-[#111522] p-5 sm:p-6";
  const label = "text-sm font-medium text-slate-200";
  const selectClass =
    "w-full rounded-lg border border-white/10 bg-[#0b0e19] px-3 py-2.5 text-white outline-none focus:border-purple-500";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 text-white">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Personalize your focus sessions and sound preferences.
        </p>
      </header>

      <section className={card}>
        <h2 className="text-lg font-semibold">Focus preferences</h2>
        <p className="mt-1 text-sm text-slate-400">
          Choose how long you want to focus and rest.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <label className="space-y-2">
            <span className={label}>Focus duration</span>
            <select
              className={selectClass}
              value={settings.focusDuration}
              onChange={(e) =>
                update("focusDuration", Number(e.target.value))
              }
            >
              {[15, 20, 25, 30, 45, 50, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className={label}>Short break</span>
            <select
              className={selectClass}
              value={settings.shortBreak}
              onChange={(e) =>
                update("shortBreak", Number(e.target.value))
              }
            >
              {[5, 10, 15].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className={label}>Long break</span>
            <select
              className={selectClass}
              value={settings.longBreak}
              onChange={(e) =>
                update("longBreak", Number(e.target.value))
              }
            >
              {[15, 20, 25, 30].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Sound preferences</h2>
        <p className="mt-1 text-sm text-slate-400">
          Configure your preferred focus experience.
        </p>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className={label}>Sound enabled</p>
            <p className="mt-1 text-sm text-slate-400">
              Allow focus sounds and audio cues.
            </p>
          </div>
          <input
            aria-label="Sound enabled"
            type="checkbox"
            className="h-5 w-5 accent-purple-500"
            checked={settings.soundEnabled}
            onChange={(e) =>
              update("soundEnabled", e.target.checked)
            }
          />
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-slate-400">
          Allow browser notifications when supported and permitted.
        </p>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className={label}>Browser notifications</p>
            <p className="mt-1 text-sm text-slate-400">
              {settings.notificationsEnabled
                ? "Notifications are enabled."
                : "Notifications are currently disabled."}
            </p>
          </div>
          <button
            type="button"
            onClick={enableNotifications}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500"
          >
            {settings.notificationsEnabled ? "Disable" : "Enable"}
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={resetSettings}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5"
        >
          Reset to defaults
        </button>
        <p role="status" className="text-sm text-emerald-400">
          {savedMessage}
        </p>
      </div>
    </div>
  );
}

export default Settings;
