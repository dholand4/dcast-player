import { useState, useCallback } from 'react';
import { Platform } from 'react-native';

export interface IUseTVFocusOptions {
  onFocus?: () => void;
  onBlur?: () => void;
}

export const useTVFocus = (options?: IUseTVFocusOptions) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    options?.onFocus?.();
  }, [options]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    options?.onBlur?.();
  }, [options]);

  return {
    isFocused,
    focusable: true,
    onFocus: handleFocus,
    onBlur: handleBlur,
    isTV: Platform.isTV,
  };
};
