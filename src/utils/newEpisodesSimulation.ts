// SIMULAÇÃO TEMPORÁRIA — apagar este arquivo e a linha que o chama em src/hooks/useNewEpisodes.ts
import { ISeriesEpisodeRef, compareEpisodes } from './newEpisodes';

const MAX_SIMULATED_SERIES = 3;

/**
 * Finge que chegou um episódio depois do último existente no servidor, só na tela.
 * Não grava nada: histórico, favoritos e o acompanhamento das séries ficam intactos.
 */
export function simulateNewEpisode(
  episodes: ISeriesEpisodeRef[],
  pending: ISeriesEpisodeRef[],
  simulatedSoFar: number
): ISeriesEpisodeRef[] {
  // Só no modo de desenvolvimento (Expo local): nunca aparece no APK nem em OTA
  if (!__DEV__ || pending.length > 0 || simulatedSoFar >= MAX_SIMULATED_SERIES) return pending;
  const last = [...episodes].sort(compareEpisodes).pop();
  if (!last) return pending;
  return [
    {
      ...last,
      id: `simulado-${last.id}`,
      episode: last.episode + 1,
      title: 'Episódio simulado',
    },
  ];
}
