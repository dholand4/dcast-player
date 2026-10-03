import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { PosterCardGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const setIsTV = (value: boolean) => {
  Object.defineProperty(Platform, 'isTV', { get: () => value, configurable: true });
};

describe('PosterCardGlobal', () => {
  afterEach(() => setIsTV(false));

  it('renders title and triggers onPress', () => {
    const onPressMock = jest.fn();
    const { getByText } = wrap(
      <PosterCardGlobal
        title="Interestelar"
        posterUrl="http://example.com/poster.jpg"
        onPress={onPressMock}
        rating="8.6"
      />
    );

    expect(getByText('Interestelar')).toBeTruthy();
    expect(getByText('8.6')).toBeTruthy();

    fireEvent.press(getByText('Interestelar'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows the heart only for favorites and favorites on long press', () => {
    const onLongPress = jest.fn();
    const { getByText, queryByTestId, rerender } = wrap(
      <PosterCardGlobal title="Duna" onPress={jest.fn()} onLongPress={onLongPress} testID="poster-1" />
    );

    expect(queryByTestId('poster-1-favorite')).toBeNull();
    fireEvent(getByText('Duna'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);

    rerender(
      <ThemeProvider theme={theme}>
        <PosterCardGlobal title="Duna" onPress={jest.fn()} isFavorite testID="poster-1" />
      </ThemeProvider>
    );
    expect(queryByTestId('poster-1-favorite')).toBeTruthy();
  });

  it('on TV swaps the corner X for a Remover button below the card', () => {
    setIsTV(true);
    const onRemove = jest.fn();
    const onPress = jest.fn();
    const { getByText, queryByTestId, getByTestId } = wrap(
      <PosterCardGlobal title="Interestelar" onPress={onPress} onRemove={onRemove} testID="cw-1" />
    );

    expect(queryByTestId('remove-cw-1')).toBeNull();
    fireEvent.press(getByTestId('tv-remove-cw-1'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    fireEvent.press(getByText('Interestelar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps the corner X and no Remover button off TV', () => {
    const { queryByTestId } = wrap(
      <PosterCardGlobal title="Interestelar" onPress={() => {}} onRemove={() => {}} testID="cw-1" />
    );

    expect(queryByTestId('remove-cw-1')).toBeTruthy();
    expect(queryByTestId('tv-remove-cw-1')).toBeNull();
  });

  it('shows no Remover button on TV outside Continuar Assistindo', () => {
    setIsTV(true);
    const { queryByTestId } = wrap(
      <PosterCardGlobal title="Interestelar" onPress={() => {}} testID="fav-1" />
    );

    expect(queryByTestId('tv-remove-fav-1')).toBeNull();
  });
});
