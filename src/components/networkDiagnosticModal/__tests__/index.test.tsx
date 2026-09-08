import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { NetworkDiagnosticModal } from '../index';
import { networkDiagnosticService } from '../../../services/networkDiagnosticService';
import { IAccountCredentials } from '../../../@types/xtream';

const mockAccount: IAccountCredentials = {
  serverUrl: 'http://stream.example.com:8080',
  username: 'user123',
  password: 'pass123',
  label: 'Minha Lista',
};

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('NetworkDiagnosticModal', () => {
  beforeEach(() => {
    jest.spyOn(networkDiagnosticService, 'runFullDiagnostic').mockResolvedValue({
      pingMs: 42,
      jitterMs: 5,
      downloadSpeedMbps: 28.4,
      quality: '4k',
      qualityLabel: 'Excelente (4K UHD)',
      qualityDescription: 'Sua conexão é excelente.',
      tips: ['Use Wi-Fi 5GHz para melhor sinal.'],
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders modal when visible', async () => {
    const onClose = jest.fn();
    const { getByTestId, getByText } = wrap(
      <NetworkDiagnosticModal visible={true} onClose={onClose} account={mockAccount} />
    );

    expect(getByTestId('network-diagnostic-modal')).toBeTruthy();
    expect(getByText('Diagnóstico de Conexão')).toBeTruthy();
  });

  it('closes when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = wrap(
      <NetworkDiagnosticModal visible={true} onClose={onClose} account={mockAccount} />
    );

    const closeBtn = getByTestId('close-diagnostic-button');
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays diagnostic results after completion', async () => {
    const onClose = jest.fn();
    const { getByTestId, findByText } = wrap(
      <NetworkDiagnosticModal visible={true} onClose={onClose} account={mockAccount} />
    );

    const speedVal = await findByText('28.4');
    expect(speedVal).toBeTruthy();
    expect(getByTestId('diagnostic-ping-card')).toBeTruthy();
    expect(getByTestId('diagnostic-jitter-card')).toBeTruthy();
  });

  it('retries diagnostic when retry button is pressed', async () => {
    const onClose = jest.fn();
    const { getByTestId } = wrap(
      <NetworkDiagnosticModal visible={true} onClose={onClose} account={mockAccount} />
    );

    const retryBtn = getByTestId('retry-diagnostic-button');
    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(networkDiagnosticService.runFullDiagnostic).toHaveBeenCalled();
  });
});
