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
  onLogoutPress,
  showCast = true,
  testID,
}) => {
  const insets = useAppInsets();
  const theme = useTheme();

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
        <TitleContainer>
          <TitleText>{title}</TitleText>
          {subtitle ? <SubtitleText>{subtitle}</SubtitleText> : null}
          {extraInfo ? <ExtraInfoText>{extraInfo}</ExtraInfoText> : null}
        </TitleContainer>
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
        {onLogoutPress && (
          <SearchButton
            onPress={onLogoutPress}
            accessibilityRole="button"
            accessibilityLabel="Sair ou trocar lista"
            testID="header-logout-button"
          >
            <MaterialIcons name="logout" size={22} color="#E50914" />
          </SearchButton>
        )}
      </RightSection>
    </Container>
  );
};
