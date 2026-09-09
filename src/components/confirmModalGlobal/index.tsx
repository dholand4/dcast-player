import React from 'react';
import { Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IConfirmModalGlobalProps } from './types';
import {
  Overlay,
  ModalCard,
  IconBadge,
  Title,
  Description,
  ActionsRow,
  CancelButton,
  CancelButtonText,
  ConfirmButton,
  ConfirmButtonText,
} from './style';

export const ConfirmModalGlobal: React.FC<IConfirmModalGlobalProps> = ({
  visible,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  iconName,
  onConfirm,
  onCancel,
  testID = 'confirm-modal-global',
}) => {
  let resolvedIcon: keyof typeof MaterialIcons.glyphMap = 'warning';
  let iconColor = '#E50914';
  let bgColor = 'rgba(229, 9, 20, 0.15)';
  let btnColor = '#E50914';

  if (variant === 'warning') {
    resolvedIcon = 'priority-high';
    iconColor = '#FFB300';
    bgColor = 'rgba(255, 179, 0, 0.15)';
    btnColor = '#FFB300';
  } else if (variant === 'info') {
    resolvedIcon = 'info';
    iconColor = '#29B6F6';
    bgColor = 'rgba(41, 182, 246, 0.15)';
    btnColor = '#29B6F6';
  } else if (variant === 'primary') {
    resolvedIcon = 'check-circle';
    iconColor = '#E50914';
    bgColor = 'rgba(229, 9, 20, 0.15)';
    btnColor = '#E50914';
  }

  if (iconName) {
    resolvedIcon = iconName;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <Overlay testID={`${testID}-overlay`}>
        <ModalCard testID={`${testID}-card`}>
          <IconBadge bgColor={bgColor}>
            <MaterialIcons name={resolvedIcon} size={30} color={iconColor} />
          </IconBadge>

          <Title testID={`${testID}-title`}>{title}</Title>
          <Description testID={`${testID}-description`}>{description}</Description>

          <ActionsRow>
            <CancelButton
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
              testID={`${testID}-cancel`}
              activeOpacity={0.8}
            >
              <CancelButtonText>{cancelText}</CancelButtonText>
            </CancelButton>

            <ConfirmButton
              onPress={onConfirm}
              btnColor={btnColor}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
              testID={`${testID}-confirm`}
              activeOpacity={0.8}
            >
              <ConfirmButtonText>{confirmText}</ConfirmButtonText>
            </ConfirmButton>
          </ActionsRow>
        </ModalCard>
      </Overlay>
    </Modal>
  );
};
