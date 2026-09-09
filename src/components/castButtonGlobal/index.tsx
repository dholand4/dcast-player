import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import GoogleCast from 'react-native-google-cast';
import { useCast } from '../../hooks/useCast';
import { CastModalGlobal } from '../castModalGlobal';
import { ICastButtonGlobalProps } from './types';
import { CastContainer, CastPressable } from './style';

export const CastButtonGlobal: React.FC<ICastButtonGlobalProps> = ({
  tintColor,
  testID,
}) => {
  const theme = useTheme();
  const { isCasting, currentMedia, stopCast } = useCast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCastDialog = async () => {
    try {
      if (GoogleCast && typeof GoogleCast.showCastDialog === 'function') {
        await GoogleCast.showCastDialog();
      }
    } catch {
      // ignore
    }
  };

  const iconColor =
    tintColor || (isCasting ? theme.colors.primaryLight : theme.colors.text);

  return (
    <>
      <CastContainer testID={testID}>
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
      </CastContainer>

      <CastModalGlobal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isCasting={isCasting}
        currentMediaTitle={currentMedia?.title}
        onDisconnect={() => {
          stopCast();
          setIsModalOpen(false);
        }}
        onOpenNativePicker={() => {
          setIsModalOpen(false);
          handleOpenCastDialog();
        }}
      />
    </>
  );
};

