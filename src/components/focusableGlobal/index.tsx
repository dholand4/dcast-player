import React, { forwardRef, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../../constants/theme';
import { IFocusableGlobalProps } from './types';
import { FocusRing } from './style';

// Substituto do TouchableOpacity para navegação por controle remoto: o TouchableOpacity
// descarta onFocus/onBlur no Android, então nenhum destaque de foco aparecia na TV.
// O destaque fica só na TV: no celular o hasTVPreferredFocus também dá foco a um item,
// e no web o navegador já cuida do foco.

// Itens largos (linhas de lista) crescem menos para não vazar pelas laterais
const WIDE_ITEM_WIDTH = 400;
const SCALE_SMALL = 1.05;
const SCALE_WIDE = 1.02;

const RED_BACKGROUNDS = [theme.colors.primary, theme.colors.primaryDark, theme.colors.primaryLight].map(
  (color) => color.toLowerCase()
);

export const FocusableGlobal = forwardRef<View, IFocusableGlobalProps>(
  (
    {
      style,
      children,
      activeOpacity = 0.2,
      focusRing = true,
      focusable,
      disabled,
      hasTVPreferredFocus,
      onPress,
      onLongPress,
      onFocus,
      onBlur,
      onLayout,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const widthRef = useRef(0);
    const isTV = Platform.isTV;
    const showFocus = isTV && focusRing && isFocused;

    let focusStyle = null;
    let ring = null;
    if (showFocus) {
      const flat = StyleSheet.flatten(style) ?? {};
      const background = typeof flat.backgroundColor === 'string' ? flat.backgroundColor.toLowerCase() : '';
      // Contorno vermelho da marca; em botões que já são vermelhos ele sumiria, então vira branco
      const ringColor = RED_BACKGROUNDS.includes(background) ? theme.colors.white : theme.colors.primary;
      const scale = widthRef.current > WIDE_ITEM_WIDTH ? SCALE_WIDE : SCALE_SMALL;
      focusStyle = { transform: [{ scale }] };
      ring = (
        <FocusRing
          pointerEvents="none"
          radius={typeof flat.borderRadius === 'number' ? flat.borderRadius : 0}
          color={ringColor}
        />
      );
    }

    return (
      <Pressable
        ref={ref}
        {...rest}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        hasTVPreferredFocus={isTV ? hasTVPreferredFocus : undefined}
        // Mesmo critério do TouchableOpacity: só recebe foco se for clicável
        focusable={focusable !== false && !disabled && (onPress != null || onLongPress != null)}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          onLayout?.(e);
        }}
        style={({ pressed }) => [style, focusStyle, pressed && { opacity: activeOpacity }]}
      >
        {children}
        {ring}
      </Pressable>
    );
  }
);

FocusableGlobal.displayName = 'FocusableGlobal';
