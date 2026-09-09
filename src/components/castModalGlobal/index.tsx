import React from 'react';
import { Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { ICastModalGlobalProps } from './types';
import {
  Overlay,
  ModalCard,
  ModalHeader,
  HeaderLeft,
  HeaderIconBadge,
  HeaderTextContainer,
  HeaderTitle,
  HeaderSubtitle,
  CloseButton,
  BodySection,
  RadarCircle,
  ConnectedCircle,
  StatusTitle,
  StatusSubtitle,
  MediaBox,
  MediaBoxLabel,
  MediaBoxTitle,
  InfoCard,
  InfoTextContainer,
  InfoTitle,
  InfoDescription,
  ActionsContainer,
  PrimaryButton,
  PrimaryButtonText,
  SecondaryButton,
  SecondaryButtonText,
} from './style';

export const CastModalGlobal: React.FC<ICastModalGlobalProps> = ({
  visible,
  onClose,
  isCasting,
  currentMediaTitle,
  onDisconnect,
  onOpenNativePicker,
  testID = 'cast-modal-global',
}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <Overlay testID={`${testID}-overlay`}>
        <ModalCard testID={`${testID}-card`}>
          <ModalHeader>
            <HeaderLeft>
              <HeaderIconBadge>
                <MaterialIcons
                  name={isCasting ? 'cast-connected' : 'cast'}
                  size={22}
                  color={isCasting ? '#46D369' : '#29B6F6'}
                />
              </HeaderIconBadge>
              <HeaderTextContainer>
                <HeaderTitle>Transmitir para TV</HeaderTitle>
                <HeaderSubtitle>Chromecast & Smart TVs</HeaderSubtitle>
              </HeaderTextContainer>
            </HeaderLeft>

            <CloseButton
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              testID={`${testID}-close`}
            >
              <MaterialIcons name="close" size={20} color={theme.colors.text} />
            </CloseButton>
          </ModalHeader>

          <BodySection>
            {isCasting ? (
              <>
                <ConnectedCircle>
                  <MaterialIcons name="cast-connected" size={32} color="#46D369" />
                </ConnectedCircle>
                <StatusTitle testID={`${testID}-status-title`}>
                  Conectado e Transmitindo
                </StatusTitle>
                <StatusSubtitle>
                  A transmissão está ativa no seu dispositivo Cast.
                </StatusSubtitle>

                {currentMediaTitle ? (
                  <MediaBox testID={`${testID}-media-box`}>
                    <MediaBoxLabel>Mídia em Reprodução</MediaBoxLabel>
                    <MediaBoxTitle numberOfLines={2}>
                      {currentMediaTitle}
                    </MediaBoxTitle>
                  </MediaBox>
                ) : null}
              </>
            ) : (
              <>
                <RadarCircle>
                  <MaterialIcons name="tv" size={32} color="#29B6F6" />
                </RadarCircle>
                <StatusTitle testID={`${testID}-status-title`}>
                  Procurando Dispositivos na Rede
                </StatusTitle>
                <StatusSubtitle>
                  Verificando aparelhos Chromecast e Android TV disponíveis.
                </StatusSubtitle>

                <InfoCard>
                  <MaterialIcons name="wifi" size={20} color="#46D369" />
                  <InfoTextContainer>
                    <InfoTitle>Mesma Rede Wi-Fi Necessária</InfoTitle>
                    <InfoDescription>
                      Certifique-se de que a sua Smart TV ou Chromecast está
                      ligado e conectado na mesma rede Wi-Fi que este aparelho.
                    </InfoDescription>
                  </InfoTextContainer>
                </InfoCard>
              </>
            )}
          </BodySection>

          <ActionsContainer>
            {isCasting ? (
              onDisconnect && (
                <PrimaryButton
                  btnColor="#E50914"
                  onPress={onDisconnect}
                  accessibilityRole="button"
                  accessibilityLabel="Desconectar da TV"
                  testID={`${testID}-disconnect`}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="link-off" size={18} color="#FFFFFF" />
                  <PrimaryButtonText>Desconectar da TV</PrimaryButtonText>
                </PrimaryButton>
              )
            ) : (
              onOpenNativePicker && (
                <PrimaryButton
                  btnColor="#29B6F6"
                  onPress={onOpenNativePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Conectar Dispositivo Google Cast"
                  testID={`${testID}-native-picker`}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="cast" size={18} color="#FFFFFF" />
                  <PrimaryButtonText>Selecionar no Google Cast</PrimaryButtonText>
                </PrimaryButton>
              )
            )}

            <SecondaryButton
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              testID={`${testID}-footer-close`}
              activeOpacity={0.8}
            >
              <SecondaryButtonText>Fechar</SecondaryButtonText>
            </SecondaryButton>
          </ActionsContainer>
        </ModalCard>
      </Overlay>
    </Modal>
  );
};
