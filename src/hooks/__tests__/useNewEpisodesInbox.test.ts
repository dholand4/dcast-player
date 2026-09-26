import { renderHook, act } from '@testing-library/react-native';
import { useNewEpisodesInbox } from '../useNewEpisodesInbox';
import { storageService } from '../../services/storageService';
import { INewEpisodeItem } from '../useNewEpisodes';

const item = (seriesId: string, episodeIds: string[]): INewEpisodeItem => ({
  seriesId,
  seriesTitle: seriesId,
  posterUrl: '',
  episode: { id: episodeIds[0], season: 1, episode: 1, title: '', added: 0 },
  newCount: episodeIds.length,
  episodeIds,
  detectedAt: 1,
});

let mockItems: INewEpisodeItem[] = [];
jest.mock('../useNewEpisodes', () => ({ useNewEpisodes: () => mockItems }));

describe('useNewEpisodesInbox', () => {
  beforeEach(() => {
    storageService.saveNewEpisodesInbox({ seen: [], dismissed: [] });
    mockItems = [item('ted', ['e9', 'e10']), item('bear', ['e1'])];
  });

  it('counts unseen series and clears the badge when the panel is opened (saved for next time)', () => {
    const { result } = renderHook(() => useNewEpisodesInbox(null, 1));
    expect(result.current.unseenCount).toBe(2);

    act(() => result.current.markAllSeen());
    expect(result.current.unseenCount).toBe(0);
    expect(result.current.items).toHaveLength(2);

    const reopened = renderHook(() => useNewEpisodesInbox(null, 1));
    expect(reopened.result.current.unseenCount).toBe(0);
  });

  it('dismisses a series from the panel', () => {
    const { result } = renderHook(() => useNewEpisodesInbox(null, 1));
    act(() => result.current.dismissItem(mockItems[1]));

    expect(result.current.items.map((i) => i.seriesId)).toEqual(['ted']);
    expect(result.current.unseenCount).toBe(1);
  });
});
