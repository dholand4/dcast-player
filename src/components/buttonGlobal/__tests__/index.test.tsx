import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { ButtonGlobal } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ButtonGlobal', () => {
  it('renders label correctly', () => {
    const { getByText } = wrap(<ButtonGlobal label="Assistir" onPress={() => {}} />);
    expect(getByText('Assistir')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = wrap(<ButtonGlobal label="Assistir" onPress={onPressMock} />);

    fireEvent.press(getByText('Assistir'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('blocks press when disabled', () => {
    const onPressMock = jest.fn();
    const { getByRole } = wrap(
      <ButtonGlobal label="Assistir" onPress={onPressMock} disabled />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading is true', () => {
    const { queryByText } = wrap(
      <ButtonGlobal label="Assistir" onPress={() => {}} loading />
    );
    expect(queryByText('Assistir')).toBeNull();
  });
});
