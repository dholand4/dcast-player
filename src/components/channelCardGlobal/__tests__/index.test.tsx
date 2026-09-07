import React from 'react';
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
});
