import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IPosterCardGlobalProps } from './types';
import { BadgeGlobal } from '../badgeGlobal';
import { ProgressBarGlobal } from '../progressBarGlobal';
import {
  CardContainer,
  ImageWrapper,
  PosterImage,
  PlaceholderContainer,
  BadgeWrapper,
  ProgressWrapper,
  TitleText,
} from './style';

export const PosterCardGlobal: React.FC<IPosterCardGlobalProps> = React.memo(
  ({
    title,
    posterUrl,
    onPress,
    onLongPress,
    onRemove,
    rating,
    percentage,
    width,
    testID,
  }) => {
    const cardHeight = width ? Math.round(width * 1.5) + 38 : undefined;

    return (
      <CardContainer
        cardWidth={width}
        cardHeight={cardHeight}
        onPress={onPress}
        onLongPress={onLongPress || onRemove}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <ImageWrapper>
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
          {rating ? (
            <BadgeWrapper>
              <BadgeGlobal text={rating} variant="rating" />
            </BadgeWrapper>
          ) : null}
          {onRemove && (
            <TouchableOpacity
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
            </TouchableOpacity>
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
  },
  (prev, next) =>
    prev.title === next.title &&
    prev.posterUrl === next.posterUrl &&
    prev.rating === next.rating &&
    prev.percentage === next.percentage &&
    prev.width === next.width &&
    prev.testID === next.testID
);

