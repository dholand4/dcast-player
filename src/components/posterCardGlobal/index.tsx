import React from 'react';
import { IPosterCardGlobalProps } from './types';
import { BadgeGlobal } from '../badgeGlobal';
import { ProgressBarGlobal } from '../progressBarGlobal';
import {
  CardContainer,
  ImageWrapper,
  PosterImage,
  BadgeWrapper,
  ProgressWrapper,
  TitleText,
} from './style';

export const PosterCardGlobal: React.FC<IPosterCardGlobalProps> = React.memo(
  ({
    title,
    posterUrl,
    onPress,
    rating,
    percentage,
    width,
    testID,
  }) => {
    return (
      <CardContainer
        cardWidth={width}
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <ImageWrapper>
          <PosterImage
            source={{ uri: posterUrl }}
            contentFit="cover"
            transition={200}
          />
          {rating ? (
            <BadgeWrapper>
              <BadgeGlobal text={rating} variant="rating" />
            </BadgeWrapper>
          ) : null}
          {typeof percentage === 'number' && percentage > 0 ? (
            <ProgressWrapper>
              <ProgressBarGlobal percentage={percentage} height={4} />
            </ProgressWrapper>
          ) : null}
        </ImageWrapper>
        <TitleText>{title}</TitleText>
      </CardContainer>
    );
  }
);

