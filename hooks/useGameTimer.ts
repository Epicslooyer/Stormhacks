import { useCallback, useEffect, useRef, useState } from 'react';

export interface GameTimerState {
  elapsedTime: number; // milliseconds
  isRunning: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalPausedTime: number;
}

export interface GameTimerActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  getFormattedTime: () => string;
}

export function useGameTimer(): GameTimerState & GameTimerActions {
  const [state, setState] = useState<GameTimerState>({
    elapsedTime: 0,
    isRunning: false,
    startTime: null,
    pauseTime: null,
    totalPausedTime: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const start = useCallback(() => {
    setState(prev => {
      if (prev.isRunning) {
        console.log("Timer already running, skipping start");
        return prev;
      }

      const now = Date.now();
      console.log("Starting timer at:", now);
      
      // Start the timer interval
      intervalRef.current = setInterval(() => {
        setState(intervalPrev => {
          if (!intervalPrev.isRunning || !intervalPrev.startTime) {
            console.log("Timer interval: not running or no start time", { isRunning: intervalPrev.isRunning, startTime: intervalPrev.startTime });
            return intervalPrev;
          }
          
          const now = Date.now();
          const elapsed = now - intervalPrev.startTime - intervalPrev.totalPausedTime;
          
          console.log("Timer interval update:", { now, startTime: intervalPrev.startTime, totalPausedTime: intervalPrev.totalPausedTime, elapsed });
          
          return {
            ...intervalPrev,
            elapsedTime: Math.max(0, elapsed),
          };
        });
      }, 100); // Update every 100ms for smooth display

      return {
        ...prev,
        isRunning: true,
        startTime: prev.startTime || now,
        pauseTime: null,
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning) return prev;

      const now = Date.now();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return {
        ...prev,
        isRunning: false,
        pauseTime: now,
      };
    });
  }, []);

  const resume = useCallback(() => {
    setState(prev => {
      if (prev.isRunning || !prev.pauseTime) return prev;

      const now = Date.now();
      const pauseDuration = now - prev.pauseTime;
      
      // Restart the timer interval
      intervalRef.current = setInterval(() => {
        setState(intervalPrev => {
          if (!intervalPrev.isRunning || !intervalPrev.startTime) return intervalPrev;
          
          const now = Date.now();
          const elapsed = now - intervalPrev.startTime - intervalPrev.totalPausedTime;
          
          return {
            ...intervalPrev,
            elapsedTime: Math.max(0, elapsed),
          };
        });
      }, 100);

      return {
        ...prev,
        isRunning: true,
        totalPausedTime: prev.totalPausedTime + pauseDuration,
        pauseTime: null,
      };
    });
  }, []);

  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      pauseTime: null,
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      elapsedTime: 0,
      isRunning: false,
      startTime: null,
      pauseTime: null,
      totalPausedTime: 0,
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getFormattedTime = useCallback((): string => {
    const totalSeconds = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((state.elapsedTime % 1000) / 100);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
    }
    return `${seconds}.${milliseconds}`;
  }, [state.elapsedTime]);

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    reset,
    getFormattedTime,
  };
}
