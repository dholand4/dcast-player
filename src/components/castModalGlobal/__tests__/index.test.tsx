import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { CastModalGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('CastModalGlobal', () => {
  it('renders correctly when disconnected (searching state)', () => {
    const onClose = jest.fn();
    const onOpenNativePicker = jest.fn();

    const { getByTestId, getByText } = wrap(
      <CastModalGlobal
        visible={true}
        onClose={onClose}
        isCasting={false}
        onOpenNativePicker={onOpenNativePicker}
        testID="test-cast-modal"
      />
    );

    expect(getByTestId('test-cast-modal')).toBeTruthy();
    expect(getByText('Transmitir para TV')).toBeTruthy();
    expect(getByText('Procurando Dispositivos na Rede')).toBeTruthy();
    expect(getByText('Mesma Rede Wi-Fi Necessária')).toBeTruthy();
    expect(getByText('Selecionar no Google Cast')).toBeTruthy();
  });

  it('triggers onOpenNativePicker when select cast button is pressed', () => {
    const onClose = jest.fn();
    const onOpenNativePicker = jest.fn();

    const { getByTestId } = wrap(
      <CastModalGlobal
        visible={true}
        onClose={onClose}
        isCasting={false}
        onOpenNativePicker={onOpenNativePicker}
        testID="test-cast-modal"
      />
    );

    fireEvent.press(getByTestId('test-cast-modal-native-picker'));
    expect(onOpenNativePicker).toHaveBeenCalledTimes(1);
  });

  it('renders connected state with media title and disconnect button', () => {
    const onClose = jest.fn();
    const onDisconnect = jest.fn();

    const { getByTestId, getByText } = wrap(
      <CastModalGlobal
        visible={true}
        onClose={onClose}
        isCasting={true}
        currentMediaTitle="Origem - T1E4"
        onDisconnect={onDisconnect}
        testID="test-cast-modal"
      />
    );

    expect(getByText('Conectado e Transmitindo')).toBeTruthy();
    expect(getByText('Origem - T1E4')).toBeTruthy();

    const disconnectBtn = getByTestId('test-cast-modal-disconnect');
    expect(disconnectBtn).toBeTruthy();
    fireEvent.press(disconnectBtn);
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('closes modal when close button is pressed', () => {
    const onClose = jest.fn();

    const { getByTestId } = wrap(
      <CastModalGlobal
        visible={true}
        onClose={onClose}
        isCasting={false}
        testID="test-cast-modal"
      />
    );

    fireEvent.press(getByTestId('test-cast-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
