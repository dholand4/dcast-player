import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { PosterCardGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('PosterCardGlobal', () => {
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
});
