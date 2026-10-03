import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { FocusableGlobal } from '../index';
import { FocusRing } from '../style';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('FocusableGlobal', () => {
  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = wrap(
      <FocusableGlobal onPress={onPress}>
        <Text>Abrir</Text>
      </FocusableGlobal>
    );

    fireEvent.press(getByText('Abrir'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows the focus ring while focused and forwards focus events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId, UNSAFE_queryAllByType } = wrap(
      <FocusableGlobal testID="item" onPress={() => {}} onFocus={onFocus} onBlur={onBlur}>
        <Text>Item</Text>
      </FocusableGlobal>
    );

    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(0);

    fireEvent(getByTestId('item'), 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(1);

    fireEvent(getByTestId('item'), 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(0);
  });

  it('skips the ring when focusRing is false', () => {
    const { getByTestId, UNSAFE_queryAllByType } = wrap(
      <FocusableGlobal testID="item" onPress={() => {}} focusRing={false}>
        <Text>Item</Text>
      </FocusableGlobal>
    );

    fireEvent(getByTestId('item'), 'focus');
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(0);
  });

  it('is not focusable when disabled or without a press handler', () => {
    const { getByTestId } = wrap(
      <>
        <FocusableGlobal testID="disabled" onPress={() => {}} disabled>
          <Text>A</Text>
        </FocusableGlobal>
        <FocusableGlobal testID="no-handler">
          <Text>B</Text>
        </FocusableGlobal>
      </>
    );

    expect(getByTestId('disabled').props.focusable).toBe(false);
    expect(getByTestId('no-handler').props.focusable).toBe(false);
  });
});
