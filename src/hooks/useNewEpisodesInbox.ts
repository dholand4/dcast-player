import { useCallback, useMemo, useState } from 'react';
import { IAccountCredentials } from '../@types/xtream';
import { storageService } from '../services/storageService';
import { useNewEpisodes, INewEpisodeItem } from './useNewEpisodes';
import { countUnseen, dismiss, getVisibleItems, IInboxState, markSeen } from '../utils/newEpisodesInbox';

/**
 * Central de novidades: episódios novos das séries acompanhadas, com selo do que o
 * perfil ainda não viu. Funciona como notificação, mas só dentro do app.
 */
export function useNewEpisodesInbox(account: IAccountCredentials | null, refreshKey: unknown) {
  const newEpisodes = useNewEpisodes(account, refreshKey);
  const [inbox, setInbox] = useState<IInboxState>(() => storageService.getNewEpisodesInbox());

  const items = useMemo(() => getVisibleItems(newEpisodes, inbox), [newEpisodes, inbox]);
  const unseenCount = useMemo(() => countUnseen(items, inbox), [items, inbox]);

  const saveInbox = useCallback((next: IInboxState) => {
    storageService.saveNewEpisodesInbox(next);
    setInbox(next);
  }, []);

  const markAllSeen = useCallback(() => {
    if (unseenCount > 0) saveInbox(markSeen(items, inbox));
  }, [items, inbox, unseenCount, saveInbox]);

  const dismissItem = useCallback(
    (item: INewEpisodeItem) => saveInbox(dismiss(item, inbox)),
    [inbox, saveInbox]
  );

  return { items, unseenCount, markAllSeen, dismissItem };
}
