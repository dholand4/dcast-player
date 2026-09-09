import React, { useState } from 'react';
import { Platform, Alert, ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppInsets } from '../../hooks/useAppInsets';
import { SetupScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { IAccountCredentials } from '../../@types/xtream';
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
  SavedAccountCard,
  SavedAccountInfo,
  SavedAccountLabel,
  SavedAccountHost,
  SavedAccountActions,
  SavedAccountConnectBtn,
  SavedAccountConnectText,
  SavedAccountDeleteBtn,
  OrDivider,
  DividerLine,
  DividerText,
} from './style';

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const insets = useAppInsets();
  const [label, setLabel] = useState('Minha Lista');
  const [url, setUrl] = useState('');
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const {
    loginWithM3u,
    loginWithCredentials,
    savedAccounts,
    removeSavedAccount,
    isLoading,
    error,
  } = useAuth();

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

  const handleConnectSaved = async (acc: IAccountCredentials) => {
    const key = `${acc.serverUrl}_${acc.username}`;
    setConnectingKey(key);
    try {
      const success = await loginWithCredentials(acc);
      if (success) {
        try {
          navigation.replace('HomeScreen');
        } catch {
          // Se a troca de pilha já ocorreu, ignorar
        }
      }
    } finally {
      setConnectingKey(null);
    }
  };

  const handleRemoveSaved = (acc: IAccountCredentials) => {
    const doRemove = () => {
      removeSavedAccount(acc.serverUrl, acc.username);
    };

    const host = acc.serverUrl.replace(/^https?:\/\//i, '').replace(/:\d+.*$/, '');
    const msg = `Deseja remover "${acc.label || host}" da lista de acessos rápidos?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        doRemove();
      }
    } else {
      Alert.alert('Remover Lista', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: doRemove },
      ]);
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

      {savedAccounts && savedAccounts.length > 0 && (
        <Card style={{ marginBottom: 16 }} testID="saved-accounts-card">
          <CardTitle style={{ marginBottom: 4 }}>Suas Listas Conectadas</CardTitle>
          <HelperText style={{ marginTop: 0, marginBottom: 14, textAlign: 'left' }}>
            Toque em "Entrar" para alternar rapidamente sem precisar digitar ou colar o link:
          </HelperText>

          {savedAccounts.map((acc) => {
            const key = `${acc.serverUrl}_${acc.username}`;
            const isThisConnecting = connectingKey === key && isLoading;
            const host = acc.serverUrl.replace(/^https?:\/\//i, '').replace(/:\d+.*$/, '');

            return (
              <SavedAccountCard key={key} testID={`saved-account-${acc.username}`}>
                <SavedAccountInfo>
                  <SavedAccountLabel numberOfLines={1}>
                    {acc.label || 'Lista IPTV'}
                  </SavedAccountLabel>
                  <SavedAccountHost numberOfLines={1}>
                    🌐 {host} • @{acc.username}
                  </SavedAccountHost>
                </SavedAccountInfo>

                <SavedAccountActions>
                  <SavedAccountConnectBtn
                    onPress={() => handleConnectSaved(acc)}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Conectar à lista ${acc.label}`}
                    testID={`connect-saved-${acc.username}`}
                  >
                    {isThisConnecting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <SavedAccountConnectText>Entrar</SavedAccountConnectText>
                    )}
                  </SavedAccountConnectBtn>

                  <SavedAccountDeleteBtn
                    onPress={() => handleRemoveSaved(acc)}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${acc.label}`}
                    testID={`delete-saved-${acc.username}`}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#E50914" />
                  </SavedAccountDeleteBtn>
                </SavedAccountActions>
              </SavedAccountCard>
            );
          })}
        </Card>
      )}

      {savedAccounts && savedAccounts.length > 0 && (
        <OrDivider>
          <DividerLine />
          <DividerText>OU ADICIONAR OUTRA LISTA</DividerText>
          <DividerLine />
        </OrDivider>
      )}

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
          loading={isLoading && !connectingKey}
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
