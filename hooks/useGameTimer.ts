import { useEffect, useRef, useState } from 'react';

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

  const start = () => {
    if (state.isRunning) return;

    const now = Date.now();
    setState(prev => ({
      ...prev,
      isRunning: true,
      startTime: prev.startTime || now,
      pauseTime: null,
    }));

    // Start the timer interval
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.isRunning || !prev.startTime) return prev;
        
        const now = Date.now();
        const elapsed = now - prev.startTime - prev.totalPausedTime;
        
        return {
          ...prev,
          elapsedTime: elapsed,
        };
      });
    }, 100); // Update every 100ms for smooth display
  };

  const pause = () => {
    if (!state.isRunning) return;

    const now = Date.now();
    setState(prev => ({
      ...prev,
      isRunning: false,
      pauseTime: now,
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resume = () => {
    if (state.isRunning) return;

    const now = Date.now();
    setState(prev => {
      if (!prev.pauseTime) return prev;

      const pauseDuration = now - prev.pauseTime;
      return {
        ...prev,
        isRunning: true,
        totalPausedTime: prev.totalPausedTime + pauseDuration,
        pauseTime: null,
      };
    });

    // Restart the timer interval
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.isRunning || !prev.startTime) return prev;
        
        const now = Date.now();
        const elapsed = now - prev.startTime - prev.totalPausedTime;
        
        return {
          ...prev,
          elapsedTime: elapsed,
        };
      });
    }, 100);
  };

  const stop = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      pauseTime: null,
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = () => {
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
  };

  const getFormattedTime = (): string => {
    const totalSeconds = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((state.elapsedTime % 1000) / 100);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
    }
    return `${seconds}.${milliseconds}`;
  };

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
