import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { ProgressBarGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ProgressBarGlobal', () => {
  it('renders track and fill with specified percentage', () => {
    const { getByTestId } = wrap(
      <ProgressBarGlobal percentage={45} testID="test-progress" />
    );
    expect(getByTestId('test-progress')).toBeTruthy();
    expect(getByTestId('progress-fill')).toBeTruthy();
  });

  it('renders scrubber thumb when interactive or onSeek provided', () => {
    const onSeekMock = jest.fn();
    const { getByTestId } = wrap(
      <ProgressBarGlobal percentage={50} onSeek={onSeekMock} testID="test-seek-progress" />
    );
    expect(getByTestId('scrubber-thumb')).toBeTruthy();
  });
});

