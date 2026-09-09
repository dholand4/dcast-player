import styled from 'styled-components/native';
import { Image as ExpoImage } from 'expo-image';

interface ICardContainerProps {
  cardWidth?: number;
  cardHeight?: number;
}

export const CardContainer = styled.TouchableOpacity<ICardContainerProps>`
  width: ${({ cardWidth }) => (cardWidth ? `${cardWidth}px` : '100%')};
  ${({ cardHeight }) => (cardHeight ? `height: ${cardHeight}px;` : '')}
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const ImageWrapper = styled.View`
  width: 100%;
  aspect-ratio: 0.666;
  border-radius: ${({ theme }) => theme.radii.md}px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  position: relative;
`;

export const PlaceholderContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
`;

export const PosterImage = styled(ExpoImage)`
  width: 100%;
  height: 100%;
`;

export const BadgeWrapper = styled.View`
  position: absolute;
  top: ${({ theme }) => theme.spacing.xs}px;
  right: ${({ theme }) => theme.spacing.xs}px;
`;

export const ProgressWrapper = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

export const TitleText = styled.Text.attrs({
  numberOfLines: 1,
})`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  margin-top: ${({ theme }) => theme.spacing.xs}px;
  height: 18px;
  line-height: 18px;
`;
