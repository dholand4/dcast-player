import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IPosterCardGlobalProps } from './types';
import { BadgeGlobal } from '../badgeGlobal';
import { ProgressBarGlobal } from '../progressBarGlobal';
import { useTVFocus } from '../../hooks/useTVFocus';
import {
  CardContainer,
  ImageWrapper,
  PosterImage,
  PlaceholderContainer,
  BadgeWrapper,
  FavoriteBadge,
  ProgressWrapper,
  TitleText,
  TVRemoveWrapper,
  TVRemoveButton,
  TVRemoveText,
} from './style';
import { FocusableGlobal } from '../focusableGlobal';

export const PosterCardGlobal: React.FC<IPosterCardGlobalProps> = React.memo(
  ({
    title,
    posterUrl,
    onPress,
    onLongPress,
    onRemove,
    rating,
    percentage,
    isFavorite,
    width,
    testID,
  }) => {
    const cardHeight = width ? Math.round(width * 1.5) + 38 : undefined;
    const { isFocused, focusable, onFocus, onBlur } = useTVFocus();
    const showTVRemove = Platform.isTV && !!onRemove;

    const card = (
      <CardContainer
        cardWidth={width}
        cardHeight={cardHeight}
        onPress={onPress}
        onLongPress={onLongPress || onRemove}
        activeOpacity={0.8}
        testID={testID}
        focusable={focusable}
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={showTVRemove ? { marginBottom: 4 } : undefined}
      >
        <ImageWrapper isFocused={isFocused}>
          <PlaceholderContainer>
            <MaterialIcons name="movie" size={32} color="rgba(255, 255, 255, 0.2)" />
          </PlaceholderContainer>
          {posterUrl ? (
            <PosterImage
              source={{ uri: posterUrl }}
              contentFit="cover"
              recyclingKey={posterUrl || title}
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : null}
          {isFavorite ? (
            <FavoriteBadge testID={testID ? `${testID}-favorite` : undefined}>
              <MaterialIcons name="favorite" size={14} color="#E50914" />
            </FavoriteBadge>
          ) : null}
          {rating ? (
            <BadgeWrapper>
              <BadgeGlobal text={rating} variant="rating" />
            </BadgeWrapper>
          ) : null}
          {onRemove && !showTVRemove && (
            <FocusableGlobal
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${title} do continuar assistindo`}
              testID={`remove-${testID || title}`}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                width: 26,
                height: 26,
                borderRadius: 13,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                zIndex: 10,
              }}
            >
              <MaterialIcons name="close" size={16} color="#FFFFFF" />
            </FocusableGlobal>
          )}
          {typeof percentage === 'number' && percentage > 0 ? (
            <ProgressWrapper>
              <ProgressBarGlobal percentage={percentage} height={4} />
            </ProgressWrapper>
          ) : null}
        </ImageWrapper>
        <TitleText>{title}</TitleText>
      </CardContainer>
    );

    if (!showTVRemove) return card;

    // Fora do CardContainer: um botão dentro de outro botão não recebe foco pelo controle
    return (
      <TVRemoveWrapper cardWidth={width}>
        {card}
        <TVRemoveButton
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${title} do continuar assistindo`}
          testID={`tv-remove-${testID || title}`}
        >
          <MaterialIcons name="delete-outline" size={16} color="#AAAAAA" />
          <TVRemoveText>Remover</TVRemoveText>
        </TVRemoveButton>
      </TVRemoveWrapper>
    );
  },
  (prev, next) =>
    prev.title === next.title &&
    prev.posterUrl === next.posterUrl &&
    prev.rating === next.rating &&
    prev.percentage === next.percentage &&
    prev.isFavorite === next.isFavorite &&
    prev.width === next.width &&
    prev.testID === next.testID
);

