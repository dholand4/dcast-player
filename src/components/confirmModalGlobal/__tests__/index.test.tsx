import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { ConfirmModalGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ConfirmModalGlobal', () => {
  it('renders correctly when visible', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByTestId, getByText } = wrap(
      <ConfirmModalGlobal
        visible={true}
        title="Sair da Lista"
        description="Deseja realmente sair da lista conectada?"
        confirmText="Sair"
        cancelText="Cancelar"
        onConfirm={onConfirm}
        onCancel={onCancel}
        testID="test-confirm-modal"
      />
    );

    expect(getByTestId('test-confirm-modal')).toBeTruthy();
    expect(getByText('Sair da Lista')).toBeTruthy();
    expect(getByText('Deseja realmente sair da lista conectada?')).toBeTruthy();
    expect(getByText('Sair')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('triggers onConfirm when confirm button is pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByTestId } = wrap(
      <ConfirmModalGlobal
        visible={true}
        title="Limpar Histórico"
        description="Deseja limpar todo o histórico?"
        confirmText="Apagar Tudo"
        onConfirm={onConfirm}
        onCancel={onCancel}
        testID="test-confirm-modal"
      />
    );

    fireEvent.press(getByTestId('test-confirm-modal-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('triggers onCancel when cancel button is pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByTestId } = wrap(
      <ConfirmModalGlobal
        visible={true}
        title="Limpar Histórico"
        description="Deseja limpar todo o histórico?"
        confirmText="Apagar Tudo"
        onConfirm={onConfirm}
        onCancel={onCancel}
        testID="test-confirm-modal"
      />
    );

    fireEvent.press(getByTestId('test-confirm-modal-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders single confirm button when showCancel is false', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByTestId, queryByTestId, getByText } = wrap(
      <ConfirmModalGlobal
        visible={true}
        title="Catálogo Atualizado"
        description="O catálogo de canais foi atualizado com sucesso."
        confirmText="OK"
        showCancel={false}
        variant="success"
        onConfirm={onConfirm}
        onCancel={onCancel}
        testID="test-single-modal"
      />
    );

    expect(getByTestId('test-single-modal')).toBeTruthy();
    expect(getByText('Catálogo Atualizado')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
    expect(queryByTestId('test-single-modal-cancel')).toBeNull();

    fireEvent.press(getByTestId('test-single-modal-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
