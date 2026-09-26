import {
  findEpisodesAddedSinceLastWatch,
  updateSeriesTracking,
  pickNewEpisodes,
  ISeriesEpisodeRef,
  PENDING_EPISODE_TTL_MS,
} from '../newEpisodes';
import { IWatchProgress } from '../../@types/storage';

const DAY = 24 * 60 * 60 * 1000;
const watchedAt = Date.UTC(2026, 8, 1);

const episode = (n: number, added = 0): ISeriesEpisodeRef => ({
  id: `e${n}`,
  season: 1,
  episode: n,
  title: `Episódio ${n}`,
  added,
});

const watched = (n: number, overrides: Partial<IWatchProgress> = {}): IWatchProgress => ({
  id: `e${n}`,
  seriesId: 's1',
  title: 'Série',
  posterUrl: '',
  type: 'series',
  seasonNumber: 1,
  episodeNumber: n,
  currentTime: 1500,
  duration: 1500,
  percentage: 100,
  updatedAt: watchedAt,
  ...overrides,
});

describe('findEpisodesAddedSinceLastWatch', () => {
  it('uses the server "added" date to find episodes that arrived after the last watch', () => {
    const episodes = [episode(1, watchedAt / 1000 - 86400), episode(2, (watchedAt + DAY) / 1000)];
    expect(findEpisodesAddedSinceLastWatch(episodes, [watched(1)]).map((e) => e.id)).toEqual(['e2']);
  });

  it('finds nothing when the server does not send "added"', () => {
    expect(findEpisodesAddedSinceLastWatch([episode(1), episode(2)], [watched(1)])).toEqual([]);
  });

  it('ignores records reset by "mark as unwatched"', () => {
    const reset = watched(1, { percentage: 0, currentTime: 0 });
    expect(findEpisodesAddedSinceLastWatch([episode(2, Date.now() / 1000)], [reset])).toEqual([]);
  });
});

describe('updateSeriesTracking', () => {
  const now = watchedAt + 10 * DAY;

  it('records the current episodes as a baseline on the first check', () => {
    const tracking = updateSeriesTracking(null, [episode(1), episode(2)], [watched(1)], now);
    expect(tracking).toEqual({ knownIds: ['e1', 'e2'], pending: [] });
  });

  it('flags episodes that were not there in the previous check', () => {
    const previous = { knownIds: ['e1', 'e2'], pending: [] };
    const tracking = updateSeriesTracking(previous, [episode(1), episode(2), episode(3)], [], now);
    expect(tracking.pending).toEqual([{ id: 'e3', detectedAt: now }]);
  });

  it('keeps what it knew when the server answers with no episodes', () => {
    const previous = { knownIds: ['e1'], pending: [{ id: 'e1', detectedAt: now }] };
    expect(updateSeriesTracking(previous, [], [], now)).toBe(previous);
  });

  it('does not flag an episode that disappeared and came back', () => {
    const afterRemoval = updateSeriesTracking({ knownIds: ['e1', 'e2'], pending: [] }, [episode(1)], [], now);
    const afterReturn = updateSeriesTracking(afterRemoval, [episode(1), episode(2)], [], now);
    expect(afterReturn.pending).toEqual([]);
  });

  it('drops highlights older than the limit', () => {
    const previous = { knownIds: ['e1'], pending: [{ id: 'e1', detectedAt: now - PENDING_EPISODE_TTL_MS }] };
    expect(updateSeriesTracking(previous, [episode(1)], [], now).pending).toEqual([]);
  });
});

describe('pickNewEpisodes', () => {
  it('returns pending episodes not watched yet, in episode order', () => {
    const now = watchedAt;
    const tracking = {
      knownIds: ['e1', 'e2', 'e3'],
      pending: [
        { id: 'e3', detectedAt: now },
        { id: 'e2', detectedAt: now },
      ],
    };
    const episodes = [episode(1), episode(2), episode(3)];

    expect(pickNewEpisodes(episodes, tracking, [], now).map((e) => e.id)).toEqual(['e2', 'e3']);
    expect(pickNewEpisodes(episodes, tracking, [watched(2)], now).map((e) => e.id)).toEqual(['e3']);
  });
});
