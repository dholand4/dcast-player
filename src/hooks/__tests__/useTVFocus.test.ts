import { renderHook, act } from '@testing-library/react-native';
import { useTVFocus } from '../useTVFocus';

describe('useTVFocus', () => {
  it('initializes with isFocused false and focusable true', () => {
    const { result } = renderHook(() => useTVFocus());
    expect(result.current.isFocused).toBe(false);
    expect(result.current.focusable).toBe(true);
  });

  it('toggles isFocused on handleFocus and handleBlur', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { result } = renderHook(() => useTVFocus({ onFocus, onBlur }));

    act(() => {
      result.current.onFocus();
    });

    expect(result.current.isFocused).toBe(true);
    expect(onFocus).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onBlur();
    });

    expect(result.current.isFocused).toBe(false);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
