import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { InputGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('InputGlobal', () => {
  it('renders label and placeholder correctly', () => {
    const { getByText, getByPlaceholderText } = wrap(
      <InputGlobal label="URL da Lista" placeholder="Cole o link M3U aqui" value="" onChangeText={() => {}} />
    );
    expect(getByText('URL da Lista')).toBeTruthy();
    expect(getByPlaceholderText('Cole o link M3U aqui')).toBeTruthy();
  });

  it('handles text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = wrap(
      <InputGlobal placeholder="Link" value="" onChangeText={onChangeTextMock} />
    );

    fireEvent.changeText(getByPlaceholderText('Link'), 'http://server.com');
    expect(onChangeTextMock).toHaveBeenCalledWith('http://server.com');
  });

  it('displays error message when provided', () => {
    const { getByText } = wrap(
      <InputGlobal placeholder="Link" value="" onChangeText={() => {}} error="Link inválido" />
    );
    expect(getByText('Link inválido')).toBeTruthy();
  });

  it('calls onPaste when paste button is pressed', () => {
    const onPasteMock = jest.fn();
    const { getByText } = wrap(
      <InputGlobal placeholder="Link" value="" onChangeText={() => {}} onPaste={onPasteMock} />
    );

    fireEvent.press(getByText('Colar'));
    expect(onPasteMock).toHaveBeenCalledTimes(1);
  });
});
