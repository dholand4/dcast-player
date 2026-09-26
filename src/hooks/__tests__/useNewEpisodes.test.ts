import { renderHook, waitFor } from '@testing-library/react-native';
import { useNewEpisodes, SUMMARY_TTL_MS } from '../useNewEpisodes';
import { storageService } from '../../services/storageService';
import { xtreamService } from '../../services/xtreamService';
import { IWatchProgress } from '../../@types/storage';

const account = { serverUrl: 'http://iptv.tv', username: 'daniel', password: 'p', label: 'Lista' };

function serverWithEpisodes(seriesName: string, count: number) {
  return {
    info: { name: seriesName, cover: 'http://capa.jpg' },
    episodes: {
      '4': Array.from({ length: count }, (_, i) => ({
        id: `${seriesName}-e${i + 1}`,
        episode_num: i + 1,
        title: `Episódio ${i + 1}`,
      })),
    },
  };
}

const finished = (seriesId: string, seriesName: string, n: number): IWatchProgress => ({
  id: `${seriesName}-e${n}`,
  seriesId,
  title: `${seriesName} - T4E${n}`,
  posterUrl: '',
  type: 'series',
  seasonNumber: 4,
  episodeNumber: n,
  currentTime: 1800,
  duration: 1800,
  percentage: 100,
  updatedAt: 1000 + n,
});

describe('useNewEpisodes', () => {
  let now = Date.UTC(2026, 8, 26, 12);
  let getSeriesInfo: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    getSeriesInfo = jest.spyOn(xtreamService, 'getSeriesInfo');
    storageService.clearWatchHistory();
    storageService.saveFavorites([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('simula Ted Lasso: episódios 9 e 10 aparecem ao chegar e somem conforme são assistidos', async () => {
    storageService.saveFavorites([
      { id: 'ted', name: 'Ted Lasso', posterUrl: '', type: 'series', categoryId: '1', addedAt: 1 },
    ]);
    for (let n = 1; n <= 8; n++) storageService.saveWatchProgress(finished('ted', 'ted', n));

    // Hoje o servidor só tem até o episódio 8
    getSeriesInfo.mockResolvedValue(serverWithEpisodes('ted', 8));
    const { result, rerender } = renderHook(({ key }) => useNewEpisodes(account, key), {
      initialProps: { key: 1 },
    });
    await waitFor(() => expect(getSeriesInfo).toHaveBeenCalledTimes(1));
    expect(result.current).toEqual([]);

    // Horas depois chegam os episódios 9 e 10
    now += SUMMARY_TTL_MS + 1;
    getSeriesInfo.mockResolvedValue(serverWithEpisodes('ted', 10));
    rerender({ key: 2 });
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]).toEqual(
      expect.objectContaining({ seriesId: 'ted', seriesTitle: 'ted', newCount: 2 })
    );
    expect(result.current[0].episode).toEqual(expect.objectContaining({ id: 'ted-e9', episode: 9 }));

    // Continua em destaque nas próximas aberturas, mesmo sem nova consulta ao servidor
    rerender({ key: 3 });
    await waitFor(() => expect(result.current[0]?.newCount).toBe(2));
    expect(getSeriesInfo).toHaveBeenCalledTimes(2);

    // Assistiu o 9: passa a destacar o 10
    storageService.saveWatchProgress(finished('ted', 'ted', 9));
    rerender({ key: 4 });
    await waitFor(() => expect(result.current[0]?.episode.id).toBe('ted-e10'));
    expect(result.current[0].newCount).toBe(1);

    // Assistiu o 10: some da fileira
    storageService.saveWatchProgress(finished('ted', 'ted', 10));
    rerender({ key: 5 });
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it('acompanha série favorita mesmo sem nunca ter assistido', async () => {
    storageService.saveFavorites([
      { id: 'fav', name: 'Favorita', posterUrl: 'http://poster.jpg', type: 'series', categoryId: '1', addedAt: 1 },
    ]);
    getSeriesInfo.mockResolvedValue(serverWithEpisodes('fav', 3));
    const { result, rerender } = renderHook(({ key }) => useNewEpisodes(account, key), {
      initialProps: { key: 1 },
    });
    await waitFor(() => expect(getSeriesInfo).toHaveBeenCalledTimes(1));
    expect(result.current).toEqual([]);

    now += SUMMARY_TTL_MS + 1;
    getSeriesInfo.mockResolvedValue(serverWithEpisodes('fav', 4));
    rerender({ key: 2 });
    await waitFor(() => expect(result.current[0]?.episode.id).toBe('fav-e4'));
  });

  it('não consulta o servidor de novo antes do cache vencer', async () => {
    storageService.saveFavorites([
      { id: 'cache', name: 'Cache', posterUrl: '', type: 'series', categoryId: '1', addedAt: 1 },
    ]);
    getSeriesInfo.mockResolvedValue(serverWithEpisodes('cache', 2));
    const { rerender } = renderHook(({ key }) => useNewEpisodes(account, key), {
      initialProps: { key: 1 },
    });
    await waitFor(() => expect(getSeriesInfo).toHaveBeenCalledTimes(1));

    now += SUMMARY_TTL_MS - 1000;
    rerender({ key: 2 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getSeriesInfo).toHaveBeenCalledTimes(1);
  });
});
