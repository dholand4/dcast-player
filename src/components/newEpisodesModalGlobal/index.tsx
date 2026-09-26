import React, { useState } from 'react';
import { Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { INewEpisodesModalGlobalProps } from './types';
import { INewEpisodeItem } from '../../hooks/useNewEpisodes';
import { formatArrival } from '../../utils/formatters';
import {
  ModalOverlay,
  ModalCard,
  ModalHeader,
  TitleContainer,
  ModalTitle,
  ModalSubtitle,
  CloseButton,
  List,
  ItemRow,
  Poster,
  ItemInfo,
  ItemTitle,
  ItemSubtitle,
  DismissButton,
  EmptyContainer,
  EmptyText,
  FooterText,
} from './style';

function describeItem(item: INewEpisodeItem): string {
  const episode = `T${item.episode.season}E${item.episode.episode}`;
  const count = item.newCount > 1 ? `${item.newCount} episódios novos` : 'episódio novo';
  return `${episode} · ${count} · chegou ${formatArrival(item.detectedAt)}`;
}

export const NewEpisodesModalGlobal: React.FC<INewEpisodesModalGlobalProps> = ({
  visible,
  items,
  onClose,
  onSelect,
  onDismiss,
  testID,
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalOverlay>
        <ModalCard testID={testID}>
          <ModalHeader>
            <MaterialIcons name="notifications" size={24} color="#FFB300" />
            <TitleContainer>
              <ModalTitle>Novidades</ModalTitle>
              <ModalSubtitle>Episódios novos das suas séries</ModalSubtitle>
            </TitleContainer>
            <CloseButton
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar novidades"
              testID="new-episodes-close"
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </CloseButton>
          </ModalHeader>

          {items.length === 0 ? (
            <EmptyContainer testID="new-episodes-empty">
              <MaterialIcons name="notifications-none" size={40} color="#666666" />
              <EmptyText>
                Nenhum episódio novo. Favorite uma série para acompanhar os lançamentos.
              </EmptyText>
            </EmptyContainer>
          ) : (
            <List>
              {items.map((item, index) => (
                <ItemRow
                  key={item.seriesId}
                  onPress={() => onSelect(item)}
                  onFocus={() => setFocusedId(item.seriesId)}
                  onBlur={() => setFocusedId(null)}
                  isFocused={focusedId === item.seriesId}
                  hasTVPreferredFocus={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.seriesTitle}, ${describeItem(item)}`}
                  testID={`new-episode-${item.seriesId}`}
                >
                  <Poster source={item.posterUrl ? { uri: item.posterUrl } : undefined} contentFit="cover" />
                  <ItemInfo>
                    <ItemTitle>{item.seriesTitle}</ItemTitle>
                    <ItemSubtitle>{describeItem(item)}</ItemSubtitle>
                  </ItemInfo>
                  <DismissButton
                    onPress={() => onDismiss(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Dispensar novidade de ${item.seriesTitle}`}
                    testID={`new-episode-dismiss-${item.seriesId}`}
                  >
                    <MaterialIcons name="close" size={18} color="#AAAAAA" />
                  </DismissButton>
                  <MaterialIcons name="chevron-right" size={22} color="#AAAAAA" />
                </ItemRow>
              ))}
            </List>
          )}

          <FooterText>Acompanhando suas séries favoritas e as que você está assistindo</FooterText>
        </ModalCard>
      </ModalOverlay>
    </Modal>
  );
};
