import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { BadgeGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('BadgeGlobal', () => {
  it('renders badge text correctly', () => {
    const { getByText } = wrap(<BadgeGlobal text="4K" variant="hd" />);
    expect(getByText('4K')).toBeTruthy();
  });
});
