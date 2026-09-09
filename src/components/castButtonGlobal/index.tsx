import React, { useState } from 'react';
import { UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useCast } from '../../hooks/useCast';
import { CastModalGlobal } from '../castModalGlobal';
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
  const { isCasting, currentMedia, stopCast } = useCast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const iconColor =
    tintColor || (isCasting ? theme.colors.primaryLight : theme.colors.text);

  return (
    <CastContainer testID={testID}>
      {isNativeCastAvailable ? (
        <StyledCastButton tintColor={tintColor} />
      ) : (
        <CastPressable
          onPress={() => setIsModalOpen(true)}
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

      {!isNativeCastAvailable && (
        <CastModalGlobal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isCasting={isCasting}
          currentMediaTitle={currentMedia?.title}
          onDisconnect={() => {
            stopCast();
            setIsModalOpen(false);
          }}
        />
      )}
    </CastContainer>
  );
};

