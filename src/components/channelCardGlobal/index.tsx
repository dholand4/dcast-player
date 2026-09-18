import React from 'react';
import { IChannelCardGlobalProps } from './types';
import { useTVFocus } from '../../hooks/useTVFocus';
import {
  Container,
  ContentPressable,
  LogoWrapper,
  ChannelLogo,
  ChannelFallbackText,
  InfoContainer,
  ChannelName,
  ChannelNumber,
  ActionsContainer,
  IconButton,
  ActionIconText,
} from './style';

export const ChannelCardGlobal: React.FC<IChannelCardGlobalProps> = React.memo(
  ({
    name,
    logoUrl,
    channelNumber,
    isFavorite,
    onToggleFavorite,
    onPlay,
    testID,
  }) => {
    const { isFocused, focusable, onFocus, onBlur } = useTVFocus();

    return (
      <Container testID={testID} isFocused={isFocused}>
        <ContentPressable
          onPress={onPlay}
          activeOpacity={0.7}
          focusable={focusable}
          onFocus={onFocus}
          onBlur={onBlur}
          accessibilityRole="button"
          accessibilityLabel={`Canal ${name}`}
        >
          <LogoWrapper>
            {logoUrl ? (
              <ChannelLogo
                source={{ uri: logoUrl }}
                contentFit="contain"
                recyclingKey={logoUrl || name}
                cachePolicy="memory-disk"
              />
            ) : (
              <ChannelFallbackText>TV</ChannelFallbackText>
            )}
          </LogoWrapper>
          <InfoContainer>
            <ChannelName>{name}</ChannelName>
            {channelNumber !== undefined && (
              <ChannelNumber>Canal {channelNumber}</ChannelNumber>
            )}
          </InfoContainer>
        </ContentPressable>
        <ActionsContainer>
          <IconButton
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel="Favoritar canal"
            testID="toggle-favorite-button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ActionIconText isFavorite={isFavorite}>
              {isFavorite ? '❤️' : '🤍'}
            </ActionIconText>
          </IconButton>
        </ActionsContainer>
      </Container>
    );
  },
  (prev, next) =>
    prev.name === next.name &&
    prev.logoUrl === next.logoUrl &&
    prev.channelNumber === next.channelNumber &&
    prev.isFavorite === next.isFavorite &&
    prev.testID === next.testID
);

