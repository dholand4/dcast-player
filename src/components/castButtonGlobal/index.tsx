import React from 'react';
import { UIManager, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import GoogleCast from 'react-native-google-cast';
import { useCast } from '../../hooks/useCast';
import { ICastButtonGlobalProps } from './types';
import { CastContainer, StyledCastButton, CastPressable } from './style';

const isNativeCastAvailable = Boolean(
  UIManager.getViewManagerConfig?.('RNGoogleCastButton')
);

export const CastButtonGlobal: React.FC<ICastButtonGlobalProps> = ({
  tintColor,
  testID,
}) => {
  const theme = useTheme();
  const { isCasting } = useCast();

  const handlePressFallback = async () => {
    try {
      if (GoogleCast && typeof GoogleCast.showCastDialog === 'function') {
        await GoogleCast.showCastDialog();
        return;
      }
    } catch {
      // ignore
    }
    Alert.alert(
      'Google Cast (Chromecast)',
      'O app suporta transmissão oficial para Chromecast e Android TV / Google TV. No Expo Go, a detecção de dispositivos na rede local requer a geração de Development Build (npx expo run:android).'
    );
  };

  const iconColor =
    tintColor || (isCasting ? theme.colors.primaryLight : theme.colors.text);

  return (
    <CastContainer testID={testID}>
      {isNativeCastAvailable ? (
        <StyledCastButton tintColor={tintColor} />
      ) : (
        <CastPressable
          onPress={handlePressFallback}
          accessibilityRole="button"
          accessibilityLabel="Transmitir na TV"
          testID="cast-button-pressable"
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={isCasting ? 'cast-connected' : 'cast'}
            size={24}
            color={iconColor}
          />
        </CastPressable>
      )}
    </CastContainer>
  );
};

