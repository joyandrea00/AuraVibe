import type { FocusState } from "./focusCalculator";

export interface AdaptiveSound {
  name: string;
  intensity: number;
  description: string;
}

export function getAdaptiveSoundscape(
  state: FocusState,
  wpm: number,
  consistency: number
): AdaptiveSound {

  /*
   * AuraVibe uses both:
   * 1. Current focus state
   * 2. Typing speed (WPM)
   * 3. Typing consistency
   *
   * to dynamically select the soundscape intensity.
   */

  switch (state) {
    case "CALIBRATING":
      return {
        name: "Soft Ambient",
        intensity: 0.45,
        description:
          "A calm ambient environment is playing while AuraVibe learns your natural working rhythm.",
      };

    case "FOCUSED": {
      /*
       * Higher consistency + stable typing
       * = slightly stronger environmental sound.
       */
      const intensity =
        consistency >= 80
          ? 0.65
          : consistency >= 60
            ? 0.55
            : 0.45;

      return {
        name: "Ocean Waves",
        intensity,
        description:
          `Gentle ocean waves are supporting your stable focus. Current typing speed: ${wpm} WPM with ${consistency}% consistency.`,
      };
    }

    case "DEEP_FOCUS": {
      /*
       * Strong typing rhythm gets a deeper,
       * slightly stronger soundscape.
       */
      const intensity =
        wpm >= 60 && consistency >= 80
          ? 0.75
          : wpm >= 40 && consistency >= 70
            ? 0.65
            : 0.55;

      return {
        name: "Ocean Waves",
        intensity,
        description:
          `Your typing rhythm indicates deep focus. ${wpm} WPM and ${consistency}% consistency detected.`,
      };
    }

    case "UNSTABLE": {
      /*
       * Lower consistency means a softer
       * calming environment.
       */
      const intensity =
        consistency < 40
          ? 0.45
          : 0.55;

      return {
        name: "Forest Ambience",
        intensity,
        description:
          `Your typing rhythm is fluctuating at ${consistency}% consistency. A calming forest environment is being introduced.`,
      };
    }

    case "ATTENTION_DRIFT": {
      /*
       * Longer pauses / low typing activity
       * trigger a slightly stronger auditory cue.
       */
      const intensity =
        wpm < 15
          ? 0.70
          : 0.60;

      return {
        name: "Gentle Rain",
        intensity,
        description:
          `Attention drift detected. Typing activity is currently ${wpm} WPM. Gentle rain is being introduced as a re-engagement cue.`,
      };
    }

    case "IDLE":
      return {
        name: "Silence",
        intensity: 0,
        description:
          "No active work is currently detected, so AuraVibe has reduced the audio environment.",
      };

    default:
      return {
        name: "Soft Ambient",
        intensity: 0.45,
        description:
          "A calm adaptive background environment is active.",
      };
  }
}