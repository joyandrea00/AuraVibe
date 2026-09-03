import { useEffect, useState } from "react";
import {
  Brain,
  Check,
  Headphones,
  Pause,
  Play,
  Sparkles,
  Volume2,
  Waves,
} from "lucide-react";

import { audioEngine } from "../services/audioEngine";
import { useAppContext } from "../context/AppContext";

type Soundscape = {
  name: string;
  description: string;
  icon: "waves" | "brain" | "sparkles" | "headphones";
};

const soundscapes: Soundscape[] = [
  {
    name: "Ocean Waves",
    description:
      "A calm, rhythmic wave environment for relaxed concentration.",
    icon: "waves",
  },
  {
    name: "Gentle Rain",
    description:
      "Soft rainfall texture that helps mask distracting background noise.",
    icon: "sparkles",
  },
  {
    name: "Forest Ambience",
    description:
      "A natural, spacious atmosphere for steady and comfortable focus.",
    icon: "headphones",
  },
  {
    name: "Brown Noise",
    description:
      "A deep, low-frequency sound layer for distraction reduction.",
    icon: "brain",
  },
  {
    name: "Deep Brown Noise",
    description:
      "A stronger, deeper noise profile designed for immersive work.",
    icon: "brain",
  },
  {
    name: "Soft Ambient",
    description:
      "A gentle atmospheric layer for balanced and calm productivity.",
    icon: "sparkles",
  },
];

function Soundscapes() {
  const {
    selectedSoundscape,
    setSelectedSoundscape,
  } = useAppContext();

  const [playingSound, setPlayingSound] =
    useState<string | null>(null);

  const [volume, setVolume] = useState(70);

  const [adaptiveMode, setAdaptiveMode] =
    useState(true);

  /* Stop audio when leaving this page */
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  const getIcon = (icon: Soundscape["icon"]) => {
    const props = { size: 24 };

    if (icon === "waves") return <Waves {...props} />;
    if (icon === "brain") return <Brain {...props} />;
    if (icon === "headphones")
      return <Headphones {...props} />;

    return <Sparkles {...props} />;
  };

  const handleSelect = (name: string) => {
    setSelectedSoundscape(name);
  };

  const handlePreview = async (name: string) => {
    /* If same sound is playing, stop it */
    if (playingSound === name) {
      audioEngine.stop();
      setPlayingSound(null);
      return;
    }

    /* Play selected preview */
    await audioEngine.play(name, volume / 100);

    setPlayingSound(name);
  };

  const handleVolumeChange = (
    value: number
  ) => {
    setVolume(value);

    /* Update currently playing sound */
    if (playingSound) {
      void audioEngine.play(
        playingSound,
        value / 100
      );
    }
  };

  return (
    <div className="pb-10">
      {/* HEADER */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <Volume2 size={16} />
            ADAPTIVE AUDIO ENVIRONMENT
          </div>

          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Soundscapes
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Explore and customize your adaptive sound
            environment. Preview sounds, choose your
            preferred atmosphere, or let AuraVibe adapt
            automatically to your focus behaviour.
          </p>
        </div>

        {/* ADAPTIVE MODE */}
        <div className="flex items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.08] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Adaptive Mode
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Automatically adapt audio to focus state
            </p>
          </div>

          <button
            onClick={() =>
              setAdaptiveMode(!adaptiveMode)
            }
            className={`relative h-7 w-12 rounded-full transition ${
              adaptiveMode
                ? "bg-violet-600"
                : "bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                adaptiveMode
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* CURRENT SELECTION */}
      <section className="mt-8 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.12] to-indigo-500/[0.04] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-300">
              <Headphones size={26} />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-violet-300">
                CURRENTLY SELECTED
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                {selectedSoundscape || "No sound selected"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {adaptiveMode
                  ? "AuraVibe may automatically change this based on your live focus state."
                  : "Manual mode is active. Your selected sound will be used during focus sessions."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Mode:{" "}
            </span>

            <span className="font-semibold text-violet-200">
              {adaptiveMode
                ? "Adaptive"
                : "Manual"}
            </span>
          </div>
        </div>
      </section>

      {/* VOLUME */}
      <section className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-violet-300">
            <Volume2 size={22} />

            <div>
              <h2 className="font-semibold text-white">
                Preview Volume
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Adjust the volume while previewing a soundscape.
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) =>
                handleVolumeChange(
                  Number(event.target.value)
                )
              }
              className="w-full accent-violet-500"
            />

            <span className="min-w-10 text-right text-sm font-semibold text-white">
              {volume}%
            </span>
          </div>
        </div>
      </section>

      {/* SOUNDS */}
      <section className="mt-6">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
            AVAILABLE ENVIRONMENTS
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Choose your soundscape
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select one for your focus sessions or preview it before choosing.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {soundscapes.map((sound) => {
            const isSelected =
              selectedSoundscape === sound.name;

            const isPlaying =
              playingSound === sound.name;

            return (
              <div
                key={sound.name}
                className={`rounded-2xl border p-6 transition ${
                  isSelected
                    ? "border-violet-500/50 bg-violet-500/[0.08]"
                    : "border-white/[0.06] bg-white/[0.025] hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
                    {getIcon(sound.icon)}
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200">
                      <Check size={14} />
                      Selected
                    </div>
                  )}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  {sound.name}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
                  {sound.description}
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() =>
                      handleSelect(sound.name)
                    }
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isSelected
                        ? "border border-violet-400/20 bg-violet-500/10 text-violet-200"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90"
                    }`}
                  >
                    {isSelected
                      ? "Selected"
                      : "Select"}
                  </button>

                  <button
                    onClick={() =>
                      handlePreview(sound.name)
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      isPlaying
                        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={16} />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play
                          size={16}
                          fill="currentColor"
                        />
                        Preview
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <HowCard
          number="01"
          title="Analyse"
          description="AuraVibe observes your typing speed, consistency, pauses, and focus state."
        />

        <HowCard
          number="02"
          title="Adapt"
          description="When Adaptive Mode is active, the audio environment changes according to your behaviour."
        />

        <HowCard
          number="03"
          title="Focus"
          description="The sound intensity adjusts to support a calmer and more stable working rhythm."
        />
      </section>
    </div>
  );
}

function HowCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
      <span className="text-sm font-bold text-violet-400">
        {number}
      </span>

      <h3 className="mt-4 font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default Soundscapes;