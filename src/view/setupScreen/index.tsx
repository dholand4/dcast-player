import React, { useState } from 'react';
import { Platform, Alert, ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppInsets } from '../../hooks/useAppInsets';
import { SetupScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { IAccountCredentials } from '../../@types/xtream';
import { parseM3uUrl } from '../../utils/m3uParser';
import { InputGlobal } from '../../components/inputGlobal';
import { ButtonGlobal } from '../../components/buttonGlobal';
import { ConfirmModalGlobal } from '../../components/confirmModalGlobal';
import {
  Container,
  BrandContainer,
  BrandLogo,
  BrandTitle,
  BrandSubtitle,
  Card,
  CardTitle,
  TabSelectorContainer,
  TabButton,
  TabButtonText,
  PasswordToggleBtn,
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

function normalizeServerUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  trimmed = trimmed.replace(/\/player_api\.php.*$/i, '');
  trimmed = trimmed.replace(/\/get\.php.*$/i, '');
  trimmed = trimmed.replace(/\/+$/, '');
  return trimmed;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const insets = useAppInsets();
  const [activeTab, setActiveTab] = useState<'m3u' | 'xtream'>('m3u');
  const [label, setLabel] = useState('Minha Lista');

  // Aba 1: Link M3U
  const [url, setUrl] = useState('');

  // Aba 2: Xtream Codes API
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [accountToRemove, setAccountToRemove] = useState<IAccountCredentials | null>(null);
  const {
    loginWithM3u,
    loginWithCredentials,
    savedAccounts,
    removeSavedAccount,
    isLoading,
    error,
  } = useAuth();

  const handlePasteM3u = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text.trim());
        setFormError(null);
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleServerUrlChange = (text: string) => {
    setFormError(null);
    const parsed = parseM3uUrl(text, label);
    if (parsed) {
      setServerUrl(parsed.serverUrl);
      setUsername(parsed.username);
      setPassword(parsed.password);
      return;
    }
    setServerUrl(text);
  };

  const handlePasteServerUrl = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        handleServerUrlChange(text.trim());
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleConnectM3u = async () => {
    setFormError(null);
    const success = await loginWithM3u(url, label);
    if (success) {
      try {
        navigation.replace('HomeScreen');
      } catch {
        // Se a troca de AuthStack para AppStack já tiver assumido o controle, ignorar
      }
    }
  };

  const handleConnectXtream = async () => {
    setFormError(null);
    const cleanServer = normalizeServerUrl(serverUrl);
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanServer) {
      setFormError('Por favor, informe a URL do Servidor.');
      return;
    }
    if (!cleanUser) {
      setFormError('Por favor, informe o Usuário.');
      return;
    }
    if (!cleanPass) {
      setFormError('Por favor, informe a Senha.');
      return;
    }

    const creds: IAccountCredentials = {
      serverUrl: cleanServer,
      username: cleanUser,
      password: cleanPass,
      label: label.trim() || 'Minha Lista',
    };

    const success = await loginWithCredentials(creds);
    if (success) {
      try {
        navigation.replace('HomeScreen');
      } catch {
        // Se a troca de pilha já ocorreu, ignorar
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
    setAccountToRemove(acc);
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

        <TabSelectorContainer testID="setup-tab-selector">
          <TabButton
            active={activeTab === 'm3u'}
            onPress={() => {
              setActiveTab('m3u');
              setFormError(null);
            }}
            accessibilityRole="tab"
            accessibilityLabel="Aba Link M3U"
            testID="tab-m3u-btn"
          >
            <TabButtonText active={activeTab === 'm3u'}>Link M3U</TabButtonText>
          </TabButton>

          <TabButton
            active={activeTab === 'xtream'}
            onPress={() => {
              setActiveTab('xtream');
              setFormError(null);
            }}
            accessibilityRole="tab"
            accessibilityLabel="Aba Xtream Codes API"
            testID="tab-xtream-btn"
          >
            <TabButtonText active={activeTab === 'xtream'}>Xtream Codes API</TabButtonText>
          </TabButton>
        </TabSelectorContainer>

        <InputGlobal
          label="Nome da Lista"
          placeholder="Ex: Lista Principal"
          value={label}
          onChangeText={setLabel}
          autoCapitalize="words"
          testID="input-list-label"
        />

        {activeTab === 'm3u' ? (
          <>
            <InputGlobal
              label="Link M3U / Xtream"
              placeholder="http://servidor.com:8080/get.php?username=..."
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setFormError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              onPaste={handlePasteM3u}
              onClear={() => setUrl('')}
              error={formError || error}
              testID="input-m3u-url"
            />

            <ButtonGlobal
              label="Conectar e Assistir"
              onPress={handleConnectM3u}
              loading={isLoading && !connectingKey}
              disabled={!url.trim()}
              size="lg"
              testID="connect-m3u-button"
            />
          </>
        ) : (
          <>
            <InputGlobal
              label="URL do Servidor / DNS"
              placeholder="http://dns.meuservidor.com:8080"
              value={serverUrl}
              onChangeText={handleServerUrlChange}
              autoCapitalize="none"
              autoCorrect={false}
              onPaste={handlePasteServerUrl}
              onClear={() => setServerUrl('')}
              testID="input-xtream-server"
            />

            <InputGlobal
              label="Usuário"
              placeholder="Seu usuário"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setFormError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              onClear={() => setUsername('')}
              testID="input-xtream-username"
            />

            <InputGlobal
              label="Senha"
              placeholder="Sua senha"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setFormError(null);
              }}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              error={formError || error}
              testID="input-xtream-password"
              rightAction={
                <PasswordToggleBtn
                  onPress={() => setIsPasswordVisible((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Ver senha'}
                  testID="toggle-password-visibility"
                >
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#A0A0A0"
                  />
                </PasswordToggleBtn>
              }
            />

            <ButtonGlobal
              label="Conectar e Assistir"
              onPress={handleConnectXtream}
              loading={isLoading && !connectingKey}
              disabled={!serverUrl.trim() || !username.trim() || !password.trim()}
              size="lg"
              testID="connect-xtream-button"
            />
          </>
        )}

        <HelperText>
          O DCast Player não armazena nem distribui canais. O acesso inserido é processado de forma 100% segura e local no seu dispositivo.
        </HelperText>
      </Card>

      <ConfirmModalGlobal
        visible={Boolean(accountToRemove)}
        title="Remover Lista"
        description={
          accountToRemove
            ? `Deseja remover "${
                accountToRemove.label ||
                accountToRemove.serverUrl
                  .replace(/^https?:\/\//i, '')
                  .replace(/:\d+.*$/, '')
              }" dos seus acessos rápidos?`
            : ''
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        iconName="delete-outline"
        onConfirm={() => {
          if (accountToRemove) {
            removeSavedAccount(
              accountToRemove.serverUrl,
              accountToRemove.username
            );
            setAccountToRemove(null);
          }
        }}
        onCancel={() => setAccountToRemove(null)}
        testID="setup-remove-account-modal"
      />
    </Container>
  );
};
