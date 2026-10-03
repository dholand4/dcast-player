import React, { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { IFocusableGlobalProps } from './types';
import { FocusRing } from './style';

// Substituto do TouchableOpacity para navegação por controle remoto: o TouchableOpacity
// descarta onFocus/onBlur no Android, então nenhum destaque de foco aparecia na TV.
// No web o navegador já cuida do foco, por isso o contorno fica só no nativo.
const showRing = Platform.OS !== 'web';

export const FocusableGlobal = forwardRef<View, IFocusableGlobalProps>(
  (
    {
      style,
      children,
      activeOpacity = 0.2,
      focusRing = true,
      focusable,
      disabled,
      onPress,
      onLongPress,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const radius = StyleSheet.flatten(style)?.borderRadius;

    return (
      <Pressable
        ref={ref}
        {...rest}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
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
        style={({ pressed }) => [style, pressed && { opacity: activeOpacity }]}
      >
        {children}
        {showRing && focusRing && isFocused ? (
          <FocusRing pointerEvents="none" radius={typeof radius === 'number' ? radius : 0} />
        ) : null}
      </Pressable>
    );
  }
);

FocusableGlobal.displayName = 'FocusableGlobal';
