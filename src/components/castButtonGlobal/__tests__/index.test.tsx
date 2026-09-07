import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { CastButtonGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('CastButtonGlobal', () => {
  it('renders correctly', () => {
    const { getByTestId } = wrap(<CastButtonGlobal testID="cast-btn" />);
    expect(getByTestId('cast-btn')).toBeTruthy();
  });
});
