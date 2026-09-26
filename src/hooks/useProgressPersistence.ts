import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const PROGRESS_SAVE_INTERVAL_MS = 20000;

export interface IProgressSnapshot {
  time: number;
  duration: number;
}

interface IUseProgressPersistenceParams {
  /** Salva periodicamente só enquanto estiver reproduzindo */
  isPlaying: boolean;
  getSnapshot: () => IProgressSnapshot;
  persist: (time: number, duration: number) => void;
}

/**
 * Salva o progresso a cada 20s durante a reprodução, quando o app vai para segundo plano
 * (o Android pode encerrá-lo sem aviso) e ao sair da tela.
 */
export function useProgressPersistence({
  isPlaying,
  getSnapshot,
  persist,
}: IUseProgressPersistenceParams) {
  const getSnapshotRef = useRef(getSnapshot);
  const persistRef = useRef(persist);
  getSnapshotRef.current = getSnapshot;
  persistRef.current = persist;

  const saveNowRef = useRef(() => {
    const { time, duration } = getSnapshotRef.current();
    if (time > 0 && duration > 0) {
      persistRef.current(time, duration);
    }
  });

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => saveNowRef.current(), PROGRESS_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        saveNowRef.current();
      }
    });
    const saveNow = saveNowRef.current;
    return () => {
      subscription.remove();
      saveNow();
    };
  }, []);
}
