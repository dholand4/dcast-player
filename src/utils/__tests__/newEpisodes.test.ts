import { findNewEpisode, ISeriesEpisodeRef } from '../newEpisodes';
import { IWatchProgress } from '../../@types/storage';

const DAY = 24 * 60 * 60 * 1000;
const watchedAt = Date.UTC(2026, 8, 1);

const episodes: ISeriesEpisodeRef[] = [
  { id: 'e1', season: 1, episode: 1, title: 'Piloto', added: watchedAt / 1000 - 30 * 86400 },
  { id: 'e2', season: 1, episode: 2, title: 'Dois', added: watchedAt / 1000 - 30 * 86400 },
  { id: 'e3', season: 1, episode: 3, title: 'Três', added: (watchedAt + 2 * DAY) / 1000 },
];

const watched = (id: string, episode: number, overrides: Partial<IWatchProgress> = {}): IWatchProgress => ({
  id,
  seriesId: 's1',
  title: 'Série',
  posterUrl: '',
  type: 'series',
  seasonNumber: 1,
  episodeNumber: episode,
  currentTime: 1500,
  duration: 1500,
  percentage: 100,
  updatedAt: watchedAt,
  ...overrides,
});

describe('findNewEpisode', () => {
  it('returns the next episode added after the last time the series was watched', () => {
    const result = findNewEpisode(episodes, [watched('e1', 1, { updatedAt: watchedAt - DAY }), watched('e2', 2)]);
    expect(result?.id).toBe('e3');
  });

  it('ignores the next episode when it already existed before the last watch', () => {
    expect(findNewEpisode(episodes, [watched('e1', 1)])).toBeNull();
  });

  it('skips series still shown in Continue Watching', () => {
    const inProgress = watched('e2', 2, { percentage: 40, currentTime: 600 });
    expect(findNewEpisode(episodes, [watched('e1', 1, { updatedAt: watchedAt - DAY }), inProgress])).toBeNull();
  });

  it('still shows it when the series was removed from Continue Watching', () => {
    const hidden = watched('e2', 2, { percentage: 40, hiddenFromContinue: true });
    expect(findNewEpisode(episodes, [hidden])?.id).toBe('e3');
  });

  it('ignores records reset by "mark as unwatched"', () => {
    const reset = watched('e2', 2, { percentage: 0, currentTime: 0, hiddenFromContinue: true });
    expect(findNewEpisode(episodes, [reset])).toBeNull();
  });
});
