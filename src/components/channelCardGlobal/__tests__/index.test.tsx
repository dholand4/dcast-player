import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { ChannelCardGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ChannelCardGlobal', () => {
  it('renders channel name and responds to press', () => {
    const onPlayMock = jest.fn();
    const onToggleMock = jest.fn();

    const { getByText, getByTestId } = wrap(
      <ChannelCardGlobal
        name="ESPN HD"
        channelNumber={101}
        isFavorite={false}
        onPlay={onPlayMock}
        onToggleFavorite={onToggleMock}
      />
    );

    expect(getByText('ESPN HD')).toBeTruthy();
    expect(getByText('Canal 101')).toBeTruthy();

    fireEvent.press(getByText('ESPN HD'));
    expect(onPlayMock).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('toggle-favorite-button'));
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('highlights the card on focus without a transform on the wrapper', () => {
    const { getByTestId, getByLabelText } = wrap(
      <ChannelCardGlobal
        name="ESPN HD"
        isFavorite={false}
        onPlay={() => {}}
        onToggleFavorite={() => {}}
        testID="card"
      />
    );

    fireEvent(getByLabelText('Canal ESPN HD'), 'focus');
    const style = StyleSheet.flatten(getByTestId('card').props.style);
    expect(style.borderColor).toBe(theme.colors.primary);
    // Um transform aqui remonta o botão focado no Android e o foco do controle se perde
    expect(style.transform).toBeUndefined();
  });
});
