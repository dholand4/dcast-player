import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { FocusableGlobal } from '../index';
import { FocusRing } from '../style';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const setIsTV = (value: boolean) => {
  Object.defineProperty(Platform, 'isTV', { get: () => value, configurable: true });
};

describe('FocusableGlobal', () => {
  afterEach(() => setIsTV(false));

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

  it('on TV shows a red ring and scales up while focused, forwarding focus events', () => {
    setIsTV(true);
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
    const rings = UNSAFE_queryAllByType(FocusRing);
    expect(rings).toHaveLength(1);
    expect(rings[0].props.color).toBe(theme.colors.primary);
    expect(StyleSheet.flatten(getByTestId('item').props.style).transform).toEqual([{ scale: 1.05 }]);

    fireEvent(getByTestId('item'), 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(0);
  });

  it('uses a white ring on red buttons', () => {
    setIsTV(true);
    const { getByTestId, UNSAFE_getByType } = wrap(
      <FocusableGlobal
        testID="item"
        onPress={() => {}}
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Text>Item</Text>
      </FocusableGlobal>
    );

    fireEvent(getByTestId('item'), 'focus');
    expect(UNSAFE_getByType(FocusRing).props.color).toBe(theme.colors.white);
  });

  it('keeps wide rows at their size, with the ring only', () => {
    setIsTV(true);
    const { getByTestId, UNSAFE_queryAllByType } = wrap(
      <FocusableGlobal testID="item" onPress={() => {}}>
        <Text>Item</Text>
      </FocusableGlobal>
    );

    fireEvent(getByTestId('item'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 800, height: 60 } },
    });
    fireEvent(getByTestId('item'), 'focus');
    expect(StyleSheet.flatten(getByTestId('item').props.style).transform).toBeUndefined();
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(1);
  });

  it('shows no highlight off TV, even when focused', () => {
    const onFocus = jest.fn();
    const { getByTestId, UNSAFE_queryAllByType } = wrap(
      <FocusableGlobal testID="item" onPress={() => {}} onFocus={onFocus} hasTVPreferredFocus>
        <Text>Item</Text>
      </FocusableGlobal>
    );

    expect(getByTestId('item').props.hasTVPreferredFocus).toBeUndefined();
    fireEvent(getByTestId('item'), 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(0);
  });

  it('skips the highlight when focusRing is false', () => {
    setIsTV(true);
    const { getByTestId, UNSAFE_queryAllByType } = wrap(
      <FocusableGlobal testID="item" onPress={() => {}} focusRing={false}>
        <Text>Item</Text>
      </FocusableGlobal>
    );

    fireEvent(getByTestId('item'), 'focus');
    expect(UNSAFE_queryAllByType(FocusRing)).toHaveLength(0);
    expect(StyleSheet.flatten(getByTestId('item').props.style).transform).toBeUndefined();
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
