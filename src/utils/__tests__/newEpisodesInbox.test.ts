import { getVisibleItems, countUnseen, markSeen, dismiss } from '../newEpisodesInbox';
import { formatArrival } from '../formatters';

const ted = { seriesId: 'ted', episodeIds: ['e9', 'e10'] };
const bear = { seriesId: 'bear', episodeIds: ['e1'] };
const empty = { seen: [], dismissed: [] };

describe('newEpisodesInbox', () => {
  it('counts every series with unseen episodes and clears the badge when opened', () => {
    expect(countUnseen([ted, bear], empty)).toBe(2);
    const seen = markSeen([ted, bear], empty);
    expect(countUnseen([ted, bear], seen)).toBe(0);
    expect(getVisibleItems([ted, bear], seen)).toEqual([ted, bear]);
  });

  it('shows the badge again when another episode arrives for a seen series', () => {
    const seen = markSeen([{ seriesId: 'ted', episodeIds: ['e9'] }], empty);
    expect(countUnseen([ted], seen)).toBe(1);
  });

  it('does not bring the badge back just because an episode was watched', () => {
    const seen = markSeen([ted], empty);
    expect(countUnseen([{ seriesId: 'ted', episodeIds: ['e10'] }], seen)).toBe(0);
  });

  it('hides a dismissed series until a new episode arrives', () => {
    const state = dismiss(bear, empty);
    expect(getVisibleItems([ted, bear], state)).toEqual([ted]);
    expect(countUnseen([ted, bear], state)).toBe(1);

    const withNewEpisode = { seriesId: 'bear', episodeIds: ['e1', 'e2'] };
    expect(getVisibleItems([withNewEpisode], state)).toEqual([withNewEpisode]);
  });
});

describe('formatArrival', () => {
  const now = new Date(2026, 8, 26, 15, 0).getTime();

  it('describes when the episode arrived', () => {
    expect(formatArrival(new Date(2026, 8, 26, 1, 0).getTime(), now)).toBe('hoje');
    expect(formatArrival(new Date(2026, 8, 25, 23, 0).getTime(), now)).toBe('ontem');
    expect(formatArrival(new Date(2026, 8, 21, 10, 0).getTime(), now)).toBe('há 5 dias');
  });
});
