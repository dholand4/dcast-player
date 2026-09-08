import React, { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useAppInsets } from '../../hooks/useAppInsets';
import { SetupScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { InputGlobal } from '../../components/inputGlobal';
import { ButtonGlobal } from '../../components/buttonGlobal';
import {
  Container,
  BrandContainer,
  BrandLogo,
  BrandTitle,
  BrandSubtitle,
  Card,
  CardTitle,
  HelperText,
} from './style';

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const insets = useAppInsets();
  const [label, setLabel] = useState('Minha Lista');
  const [url, setUrl] = useState('');
  const { loginWithM3u, isLoading, error } = useAuth();

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleConnect = async () => {
    const success = await loginWithM3u(url, label);
    if (success) {
      try {
        navigation.replace('HomeScreen');
      } catch {
        // Se a troca de AuthStack para AppStack já tiver assumido o controle, ignorar
      }
    }
  };

  return (
    <Container insetTop={insets.top} testID="setup-screen">
      <BrandContainer>
        <BrandLogo
          source={require('../../../assets/icon.png')}
          resizeMode="contain"
          testID="brand-logo"
        />
        <BrandTitle>DCAST PLAYER</BrandTitle>
        <BrandSubtitle>IPTV Vertical & Cast nativo para sua TV</BrandSubtitle>
      </BrandContainer>

      <Card>
        <CardTitle>Adicionar Lista IPTV</CardTitle>

        <InputGlobal
          label="Nome da Lista"
          placeholder="Ex: Lista Principal"
          value={label}
          onChangeText={setLabel}
          autoCapitalize="words"
        />

        <InputGlobal
          label="Link M3U / Xtream"
          placeholder="http://servidor.com:8080/get.php?username=..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          onPaste={handlePaste}
          onClear={() => setUrl('')}
          error={error}
        />

        <ButtonGlobal
          label="Conectar e Assistir"
          onPress={handleConnect}
          loading={isLoading}
          disabled={!url.trim()}
          size="lg"
        />

        <HelperText>
          O DCast Player não armazena nem distribui canais. O link inserido é processado de forma 100% segura e local no seu dispositivo.
        </HelperText>
      </Card>
    </Container>
  );
};
