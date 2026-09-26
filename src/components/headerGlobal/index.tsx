import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAppInsets } from '../../hooks/useAppInsets';
import { IHeaderGlobalProps } from './types';
import { CastButtonGlobal } from '../castButtonGlobal';
import {
  Container,
  LeftSection,
  BackButton,
  BackIconText,
  TitleButton,
  TitleContainer,
  TitleText,
  SubtitleText,
  ExtraInfoText,
  RightSection,
  SearchButton,
} from './style';

export const HeaderGlobal: React.FC<IHeaderGlobalProps> = ({
  title,
  subtitle,
  extraInfo,
  onBack,
  onSearchPress,
  showCast = true,
  leftAccessory,
  onTitlePress,
  titleAccessibilityLabel,
  testID,
}) => {
  const insets = useAppInsets();
  const theme = useTheme();

  const titleContent = (
    <TitleContainer>
      <TitleText>{title}</TitleText>
      {subtitle ? <SubtitleText>{subtitle}</SubtitleText> : null}
      {extraInfo ? <ExtraInfoText>{extraInfo}</ExtraInfoText> : null}
    </TitleContainer>
  );

  return (
    <Container insetTop={insets.top} testID={testID}>
      <LeftSection>
        {onBack && (
          <BackButton
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            testID="header-back-button"
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </BackButton>
        )}
        {onTitlePress ? (
          <TitleButton
            onPress={onTitlePress}
            accessibilityRole="button"
            accessibilityLabel={titleAccessibilityLabel ?? title}
            testID="header-title-button"
          >
            {leftAccessory}
            {titleContent}
          </TitleButton>
        ) : (
          <>
            {leftAccessory}
            {titleContent}
          </>
        )}
      </LeftSection>
      <RightSection>
        {onSearchPress && (
          <SearchButton
            onPress={onSearchPress}
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            testID="header-search-button"
          >
            <MaterialIcons name="search" size={24} color={theme.colors.text} />
          </SearchButton>
        )}
        {showCast && <CastButtonGlobal />}
      </RightSection>
    </Container>
  );
};
