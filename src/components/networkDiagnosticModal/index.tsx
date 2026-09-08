import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { INetworkDiagnosticModalProps } from './types';
import {
  networkDiagnosticService,
  IDiagnosticResult,
  IDiagnosticProgress,
} from '../../services/networkDiagnosticService';
import {
  ModalOverlay,
  ModalCard,
  ModalHeader,
  TitleContainer,
  ModalTitle,
  ModalSubtitle,
  CloseButton,
  MainGauge,
  SpeedValueText,
  SpeedUnitText,
  StatusMessageText,
  MetricsRow,
  MetricCard,
  MetricLabel,
  MetricValue,
  QualityBox,
  QualityHeader,
  QualityLabelText,
  QualityDescriptionText,
  TipsContainer,
  TipsTitle,
  TipItem,
  TipText,
  ActionRow,
  RetryButton,
  RetryButtonText,
  DoneButton,
  DoneButtonText,
} from './style';

export const NetworkDiagnosticModal: React.FC<INetworkDiagnosticModalProps> = ({
  visible,
  onClose,
  account,
}) => {
  const theme = useTheme();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<IDiagnosticProgress>({
    step: 'idle',
    message: 'Pronto para iniciar teste...',
  });
  const [result, setResult] = useState<IDiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startTest = useCallback(async () => {
    if (!account) {
      setError('Nenhuma conta IPTV conectada para testar.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await networkDiagnosticService.runFullDiagnostic(
        account,
        (p) => setProgress(p),
        abortControllerRef.current.signal
      );
      setResult(res);
    } catch (err: unknown) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Falha no teste de conexão.';
      setError(msg);
      setProgress({ step: 'error', message: msg });
    } finally {
      setIsRunning(false);
    }
  }, [account]);

  useEffect(() => {
    if (visible && !result && !isRunning) {
      startTest();
    }
  }, [visible, result, isRunning, startTest]);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    onClose();
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case '4k':
        return '#46D369';
      case 'fhd':
        return '#29B6F6';
      case 'hd':
        return '#FFB300';
      default:
        return '#E50914';
    }
  };

  const getQualityIcon = (quality?: string): keyof typeof MaterialIcons.glyphMap => {
    switch (quality) {
      case '4k':
        return 'verified';
      case 'fhd':
        return 'high-quality';
      case 'hd':
        return 'tv';
      default:
        return 'warning';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      testID="network-diagnostic-modal"
    >
      <ModalOverlay>
        <ModalCard>
          <ModalHeader>
            <TitleContainer>
              <ModalTitle>Diagnóstico de Conexão</ModalTitle>
              <ModalSubtitle>
                {account?.serverUrl
                  ? `Servidor: ${account.serverUrl.replace(/^https?:\/\//, '')}`
                  : 'Teste de Rota IPTV'}
              </ModalSubtitle>
            </TitleContainer>
            <CloseButton
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar diagnóstico"
              testID="close-diagnostic-button"
            >
              <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
            </CloseButton>
          </ModalHeader>

          {/* Medidor Principal */}
          <MainGauge>
            {isRunning && (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
                style={{ marginBottom: 8 }}
              />
            )}
            <SpeedValueText testID="diagnostic-speed-value">
              {result
                ? result.downloadSpeedMbps.toFixed(1)
                : progress.currentSpeedMbps
                ? progress.currentSpeedMbps.toFixed(1)
                : isRunning
                ? '...'
                : '--'}
            </SpeedValueText>
            <SpeedUnitText>Megabits / seg (Mbps)</SpeedUnitText>
            <StatusMessageText numberOfLines={2}>
              {error ? error : progress.message}
            </StatusMessageText>
          </MainGauge>

          {/* Cards de Métricas */}
          <MetricsRow>
            <MetricCard testID="diagnostic-ping-card">
              <MaterialIcons name="network-check" size={18} color="#29B6F6" />
              <MetricLabel>LATÊNCIA</MetricLabel>
              <MetricValue>
                {result
                  ? `${result.pingMs} ms`
                  : progress.currentPing
                  ? `${progress.currentPing} ms`
                  : '--'}
              </MetricValue>
            </MetricCard>

            <MetricCard testID="diagnostic-jitter-card">
              <MaterialIcons name="swap-vert" size={18} color="#FFB300" />
              <MetricLabel>JITTER</MetricLabel>
              <MetricValue>{result ? `${result.jitterMs} ms` : '--'}</MetricValue>
            </MetricCard>

            <MetricCard testID="diagnostic-status-card">
              <MaterialIcons
                name={getQualityIcon(result?.quality)}
                size={18}
                color={getQualityColor(result?.quality)}
              />
              <MetricLabel>QUALIDADE</MetricLabel>
              <MetricValue
                style={{
                  color: getQualityColor(result?.quality),
                  fontSize: 13,
                  textTransform: 'uppercase',
                }}
              >
                {result ? result.quality : isRunning ? 'Testando' : '--'}
              </MetricValue>
            </MetricCard>
          </MetricsRow>

          {/* Box de Classificação e Capacidade */}
          {result && (
            <QualityBox borderColor={getQualityColor(result.quality)}>
              <QualityHeader>
                <MaterialIcons
                  name={getQualityIcon(result.quality)}
                  size={20}
                  color={getQualityColor(result.quality)}
                />
                <QualityLabelText color={getQualityColor(result.quality)}>
                  {result.qualityLabel}
                </QualityLabelText>
              </QualityHeader>
              <QualityDescriptionText>{result.qualityDescription}</QualityDescriptionText>
            </QualityBox>
          )}

          {/* Recomendações e Dicas */}
          {result && result.tips.length > 0 && (
            <TipsContainer>
              <TipsTitle>Dicas para Máxima Estabilidade:</TipsTitle>
              {result.tips.map((tip, idx) => (
                <TipItem key={`tip-${idx}`}>
                  <MaterialIcons
                    name="lightbulb-outline"
                    size={14}
                    color="#FFB300"
                    style={{ marginTop: 2 }}
                  />
                  <TipText>{tip}</TipText>
                </TipItem>
              ))}
            </TipsContainer>
          )}

          {/* Botões de Ação */}
          <ActionRow>
            <RetryButton
              onPress={startTest}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel="Testar novamente"
              testID="retry-diagnostic-button"
              style={{ opacity: isRunning ? 0.5 : 1 }}
            >
              <MaterialIcons name="refresh" size={16} color={theme.colors.text} />
              <RetryButtonText>
                {isRunning ? 'Testando...' : 'Testar Novamente'}
              </RetryButtonText>
            </RetryButton>

            <DoneButton
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Concluído"
              testID="done-diagnostic-button"
            >
              <DoneButtonText>Concluir</DoneButtonText>
            </DoneButton>
          </ActionRow>
        </ModalCard>
      </ModalOverlay>
    </Modal>
  );
};
