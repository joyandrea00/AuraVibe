class AudioEngine {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private secondOscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private secondGainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private currentSound = "";

  private async ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    return this.context;
  }

  private fadeAndStop() {
    if (!this.context) return;

    const now = this.context.currentTime;
    const fadeTime = 0.5;

    const oldOscillator = this.oscillator;
    const oldSecondOscillator = this.secondOscillator;
    const oldGain = this.gainNode;
    const oldSecondGain = this.secondGainNode;
    const oldLfo = this.lfo;
    const oldLfoGain = this.lfoGain;

    if (oldGain) {
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0.001, now + fadeTime);
    }

    if (oldSecondGain) {
      oldSecondGain.gain.cancelScheduledValues(now);
      oldSecondGain.gain.setValueAtTime(
        oldSecondGain.gain.value,
        now
      );
      oldSecondGain.gain.linearRampToValueAtTime(
        0.001,
        now + fadeTime
      );
    }

    setTimeout(() => {
      try {
        oldLfo?.stop();
        oldLfo?.disconnect();
        oldLfoGain?.disconnect();

        oldOscillator?.stop();
        oldOscillator?.disconnect();

        oldSecondOscillator?.stop();
        oldSecondOscillator?.disconnect();

        oldGain?.disconnect();
        oldSecondGain?.disconnect();
      } catch {
        // Nodes may already be stopped
      }
    }, 550);

    this.oscillator = null;
    this.secondOscillator = null;
    this.gainNode = null;
    this.secondGainNode = null;
    this.lfo = null;
    this.lfoGain = null;
  }

  async play(soundName: string, intensity: number = 0.5) {
    if (
      this.currentSound === soundName &&
      this.oscillator &&
      this.gainNode
    ) {
      this.setVolume(intensity);
      return;
    }

    this.fadeAndStop();
    this.currentSound = soundName;

    if (soundName === "Silence") {
      return;
    }

    const context = await this.ensureContext();
    const now = context.currentTime;

    const maxVolume = Math.min(
      Math.max(intensity * 0.28, 0.08),
      0.25
    );

    this.gainNode = context.createGain();
    this.secondGainNode = context.createGain();

    this.gainNode.gain.setValueAtTime(0.001, now);
    this.secondGainNode.gain.setValueAtTime(0.001, now);

    this.gainNode.connect(context.destination);
    this.secondGainNode.connect(context.destination);

    this.oscillator = context.createOscillator();
    this.secondOscillator = context.createOscillator();

    const soundSettings: Record<
      string,
      {
        frequency: number;
        secondFrequency: number;
        modulationSpeed: number;
        modulationAmount: number;
      }
    > = {
      "Soft Ambient": {
        frequency: 174.61,
        secondFrequency: 220,
        modulationSpeed: 0.08,
        modulationAmount: 0.02,
      },

      "Ocean Waves": {
        frequency: 196,
        secondFrequency: 220,
        modulationSpeed: 0.12,
        modulationAmount: 0.08,
      },

      "Forest Ambience": {
        frequency: 164.81,
        secondFrequency: 207.65,
        modulationSpeed: 0.18,
        modulationAmount: 0.04,
      },

      "Gentle Rain": {
        frequency: 220,
        secondFrequency: 261.63,
        modulationSpeed: 0.35,
        modulationAmount: 0.03,
      },

      "Brown Noise": {
        frequency: 110,
        secondFrequency: 146.83,
        modulationSpeed: 0.06,
        modulationAmount: 0.015,
      },

      "Deep Brown Noise": {
        frequency: 82.41,
        secondFrequency: 110,
        modulationSpeed: 0.04,
        modulationAmount: 0.01,
      },

      "Fireplace": {
        frequency: 146.83,
        secondFrequency: 196,
        modulationSpeed: 0.25,
        modulationAmount: 0.035,
      },
    };

    const setting =
      soundSettings[soundName] ||
      soundSettings["Soft Ambient"];

    this.oscillator.type = "sine";
    this.secondOscillator.type = "sine";

    this.oscillator.frequency.setValueAtTime(
      setting.frequency,
      now
    );

    this.secondOscillator.frequency.setValueAtTime(
      setting.secondFrequency,
      now
    );

    this.oscillator.connect(this.gainNode);
    this.secondOscillator.connect(this.secondGainNode);

    // LFO creates gentle movement in volume
    this.lfo = context.createOscillator();
    this.lfoGain = context.createGain();

    this.lfo.type = "sine";
    this.lfo.frequency.setValueAtTime(
      setting.modulationSpeed,
      now
    );

    this.lfoGain.gain.setValueAtTime(
      maxVolume * setting.modulationAmount,
      now
    );

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.gainNode.gain);

    this.oscillator.start();
    this.secondOscillator.start();
    this.lfo.start();

    // Smooth fade-in
    this.gainNode.gain.linearRampToValueAtTime(
      maxVolume,
      now + 0.8
    );

    this.secondGainNode.gain.linearRampToValueAtTime(
      maxVolume * 0.45,
      now + 0.8
    );
  }

  setVolume(intensity: number) {
    if (!this.context || !this.gainNode) return;

    const now = this.context.currentTime;

    const volume = Math.min(
      Math.max(intensity * 0.28, 0),
      0.3
    );

    this.gainNode.gain.setTargetAtTime(
      volume,
      now,
      0.15
    );

    if (this.secondGainNode) {
      this.secondGainNode.gain.setTargetAtTime(
        volume * 0.45,
        now,
        0.15
      );
    }
  }

  stop() {
    this.currentSound = "";
    this.fadeAndStop();
  }
}

export const audioEngine = new AudioEngine();