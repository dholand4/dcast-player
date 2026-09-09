import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal, FlatList, ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAuth } from '../../hooks/useAuth';
import { xtreamService } from '../../services/xtreamService';
import { IEpgListing } from '../../@types/xtream';
import { IEpgModalGlobalProps } from './types';
import {
  ModalBackdrop,
  ModalContainer,
  ModalHeader,
  ChannelLogoWrapper,
  ChannelLogo,
  ChannelInfo,
  ChannelTitleText,
  ChannelSubText,
  CloseButton,
  HeaderSubtitleBar,
  SubtitleBarText,
  ProgramItemContainer,
  ProgramTopRow,
  ProgramTimeText,
  ProgramBadge,
  ProgramBadgeText,
  ProgramTitleText,
  ProgramDescriptionText,
  ProgressBarTrack,
  ProgressBarFill,
  LoadingWrapper,
  EmptyWrapper,
  EmptyMessageText,
} from './style';

function parseTimestamp(val: number | string | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') {
    return val > 1e11 ? Math.floor(val / 1000) : val;
  }
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    return num > 1e11 ? Math.floor(num / 1000) : num;
  }
  const date = new Date(val);
  const time = date.getTime();
  return isNaN(time) ? 0 : Math.floor(time / 1000);
}

function formatTime(val: number | string | undefined): string {
  const ts = parseTimestamp(val);
  if (!ts) return '--:--';
  const d = new Date(ts * 1000);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export const EpgModalGlobal: React.FC<IEpgModalGlobalProps> = ({
  visible,
  onClose,
  channelName,
  channelLogo,
  channelNumber,
  streamId,
  initialEpgList,
}) => {
  const theme = useTheme();
  const { account } = useAuth();

  const [epgList, setEpgList] = useState<IEpgListing[]>(initialEpgList || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<IEpgListing>>(null);

  const loadFullEpg = useCallback(async () => {
    if (!account || !streamId) return;
    setIsLoading(true);
    try {
      const fullList = await xtreamService.getFullEpgTable(account, streamId);
      if (fullList && fullList.length > 0) {
        setEpgList(fullList);
      } else if (initialEpgList && initialEpgList.length > 0) {
        setEpgList(initialEpgList);
      }
    } catch {
      if (initialEpgList && initialEpgList.length > 0) {
        setEpgList(initialEpgList);
      }
    } finally {
      setIsLoading(false);
    }
  }, [account, streamId, initialEpgList]);

  useEffect(() => {
    if (visible) {
      if (initialEpgList && initialEpgList.length > 0) {
        setEpgList(initialEpgList);
      }
      loadFullEpg();
    } else {
      setExpandedProgramId(null);
    }
  }, [visible, loadFullEpg, initialEpgList]);

  const nowSec = Math.floor(Date.now() / 1000);

  const currentIndex = useMemo(() => {
    if (!epgList || epgList.length === 0) return -1;
    return epgList.findIndex((item) => {
      const start = parseTimestamp(item.start_timestamp || item.start);
      const stop = parseTimestamp(item.stop_timestamp || item.end);
      if (start > 0 && stop > 0) {
        return nowSec >= start && nowSec < stop;
      }
      return item.now_playing === 1;
    });
  }, [epgList, nowSec]);

  // Auto-scroll to current program on initial load
  useEffect(() => {
    if (visible && currentIndex > 0 && flatListRef.current) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentIndex,
          animated: true,
          viewPosition: 0.2,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, currentIndex]);

  const renderProgramItem = useCallback(
    ({ item, index }: { item: IEpgListing; index: number }) => {
      const startSec = parseTimestamp(item.start_timestamp || item.start);
      const stopSec = parseTimestamp(item.stop_timestamp || item.end);

      const isCurrent =
        currentIndex >= 0
          ? index === currentIndex
          : item.now_playing === 1 || (startSec > 0 && stopSec > 0 && nowSec >= startSec && nowSec < stopSec);

      const isPast = stopSec > 0 && nowSec >= stopSec;
      const isNext = currentIndex >= 0 && index === currentIndex + 1;

      const startTimeStr = formatTime(item.start_timestamp || item.start);
      const stopTimeStr = formatTime(item.stop_timestamp || item.end);

      let progressPercent = 0;
      if (isCurrent && startSec > 0 && stopSec > startSec) {
        progressPercent = Math.min(100, Math.max(0, ((nowSec - startSec) / (stopSec - startSec)) * 100));
      }

      const isExpanded = expandedProgramId === item.id;
      const hasDescription = Boolean(item.description && item.description.trim().length > 0);

      return (
        <ProgramItemContainer
          isCurrent={isCurrent}
          activeOpacity={hasDescription ? 0.7 : 1}
          onPress={() => {
            if (hasDescription) {
              setExpandedProgramId(isExpanded ? null : item.id);
            }
          }}
          testID={`epg-item-${index}`}
        >
          <ProgramTopRow>
            <ProgramTimeText isCurrent={isCurrent} isPast={isPast}>
              {startTimeStr} - {stopTimeStr}
            </ProgramTimeText>

            {isCurrent ? (
              <ProgramBadge variant="now">
                <ProgramBadgeText variant="now">No Ar</ProgramBadgeText>
              </ProgramBadge>
            ) : isNext ? (
              <ProgramBadge variant="next">
                <ProgramBadgeText variant="next">A Seguir</ProgramBadgeText>
              </ProgramBadge>
            ) : isPast ? (
              <ProgramBadge variant="past">
                <ProgramBadgeText variant="past">Encerrado</ProgramBadgeText>
              </ProgramBadge>
            ) : null}
          </ProgramTopRow>

          <ProgramTitleText isCurrent={isCurrent} isPast={isPast} numberOfLines={isExpanded ? undefined : 2}>
            {item.title || 'Programa sem título'}
          </ProgramTitleText>

          {isCurrent && progressPercent > 0 && (
            <ProgressBarTrack>
              <ProgressBarFill widthPercent={progressPercent} />
            </ProgressBarTrack>
          )}

          {hasDescription && (
            <ProgramDescriptionText numberOfLines={isExpanded ? undefined : 2}>
              {item.description}
            </ProgramDescriptionText>
          )}
        </ProgramItemContainer>
      );
    },
    [currentIndex, nowSec, expandedProgramId]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <ModalBackdrop testID="epg-modal-backdrop">
        <ModalContainer testID="epg-modal-container">
          <ModalHeader>
            <ChannelLogoWrapper>
              {channelLogo ? (
                <ChannelLogo source={{ uri: channelLogo }} contentFit="contain" />
              ) : (
                <MaterialIcons name="tv" size={24} color={theme.colors.textMuted} />
              )}
            </ChannelLogoWrapper>

            <ChannelInfo>
              <ChannelTitleText>{channelName}</ChannelTitleText>
              <ChannelSubText>
                {channelNumber ? `Canal ${channelNumber} • ` : ''}Guia de Programação (EPG)
              </ChannelSubText>
            </ChannelInfo>

            <CloseButton onPress={onClose} testID="epg-modal-close" accessibilityLabel="Fechar guia">
              <MaterialIcons name="close" size={20} color={theme.colors.text} />
            </CloseButton>
          </ModalHeader>

          <HeaderSubtitleBar>
            <SubtitleBarText>Programação de Hoje</SubtitleBarText>
            {epgList.length > 0 && (
              <SubtitleBarText>{epgList.length} programas listados</SubtitleBarText>
            )}
          </HeaderSubtitleBar>

          {isLoading && epgList.length === 0 ? (
            <LoadingWrapper testID="epg-loading">
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <SubtitleBarText style={{ marginTop: 12 }}>Buscando grade de programação...</SubtitleBarText>
            </LoadingWrapper>
          ) : epgList.length === 0 ? (
            <EmptyWrapper testID="epg-empty">
              <MaterialIcons name="event-busy" size={48} color={theme.colors.textMuted} />
              <EmptyMessageText>
                Grade de programação não disponível para este canal no servidor.
              </EmptyMessageText>
            </EmptyWrapper>
          ) : (
            <FlatList
              ref={flatListRef}
              data={epgList}
              keyExtractor={(item, idx) => `epg-${item.id || idx}-${idx}`}
              renderItem={renderProgramItem}
              onScrollToIndexFailed={() => {}}
              contentContainerStyle={{ paddingBottom: 16 }}
              testID="epg-programs-list"
            />
          )}
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
};
