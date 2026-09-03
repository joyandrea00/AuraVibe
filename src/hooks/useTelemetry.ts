import { useEffect, useRef, useState } from "react";

interface TelemetryData {
  wpm: number;
  consistency: number;
  pauseDuration: number;
  keyCount: number;
}

export function useTelemetry(isRunning: boolean) {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    wpm: 0,
    consistency: 0,
    pauseDuration: 0,
    keyCount: 0,
  });

  const startTimeRef = useRef<number | null>(null);
  const keyCountRef = useRef(0);
  const intervalsRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number | null>(null);

  // Start telemetry
  useEffect(() => {
    if (isRunning && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      const pauseDuration =
        lastKeyTimeRef.current === null
          ? 0
          : (now - lastKeyTimeRef.current) / 1000;

      const elapsedMinutes =
        startTimeRef.current === null
          ? 0
          : (now - startTimeRef.current) / 60000;

      const estimatedWords = keyCountRef.current / 5;

      const wpm =
        elapsedMinutes > 0
          ? Math.round(estimatedWords / elapsedMinutes)
          : 0;

      const intervals = intervalsRef.current;

      let consistency = 0;

      if (intervals.length >= 2) {
        const average =
          intervals.reduce((sum, value) => sum + value, 0) /
          intervals.length;

        const variance =
          intervals.reduce(
            (sum, value) => sum + Math.pow(value - average, 2),
            0
          ) / intervals.length;

        const standardDeviation = Math.sqrt(variance);

        consistency = Math.max(
          0,
          Math.min(
            100,
            Math.round(100 - (standardDeviation / average) * 100)
          )
        );
      }

      setTelemetry({
        wpm,
        consistency,
        pauseDuration: Math.round(pauseDuration),
        keyCount: keyCountRef.current,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const registerKeystroke = () => {
    if (!isRunning) return;

    const now = Date.now();

    if (lastKeyTimeRef.current !== null) {
      const interval = now - lastKeyTimeRef.current;

      intervalsRef.current = [
        ...intervalsRef.current.slice(-49),
        interval,
      ];
    }

    lastKeyTimeRef.current = now;
    keyCountRef.current += 1;
  };

  const resetTelemetry = () => {
    startTimeRef.current = null;
    keyCountRef.current = 0;
    intervalsRef.current = [];
    lastKeyTimeRef.current = null;

    setTelemetry({
      wpm: 0,
      consistency: 0,
      pauseDuration: 0,
      keyCount: 0,
    });
  };

  return {
    telemetry,
    registerKeystroke,
    resetTelemetry,
  };
}