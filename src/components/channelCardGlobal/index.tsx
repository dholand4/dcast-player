import React from 'react';
import { IChannelCardGlobalProps } from './types';
import {
  Container,
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
    return (
      <Container
        onPress={onPlay}
        activeOpacity={0.7}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Canal ${name}`}
      >
        <LogoWrapper>
          {logoUrl ? (
            <ChannelLogo source={{ uri: logoUrl }} contentFit="contain" />
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
        <ActionsContainer>
          <IconButton
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel="Favoritar canal"
            testID="toggle-favorite-button"
          >
            <ActionIconText isFavorite={isFavorite}>
              {isFavorite ? '❤️' : '🤍'}
            </ActionIconText>
          </IconButton>
        </ActionsContainer>
      </Container>
    );
  }
);

