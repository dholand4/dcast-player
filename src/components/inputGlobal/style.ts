import styled from 'styled-components/native';

interface IInputWrapperProps {
  hasError: boolean;
  isFocused?: boolean;
}

export const Container = styled.View<{ noMargin?: boolean }>`
  width: 100%;
  margin-bottom: ${({ noMargin, theme }) => (noMargin ? 0 : theme.spacing.md)}px;
`;

export const Label = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

export const InputWrapper = styled.View<IInputWrapperProps>`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ hasError, isFocused, theme }) =>
    hasError
      ? theme.colors.error
      : isFocused
        ? theme.colors.primary
        : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  height: 52px;
`;

export const StyledTextInput = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.colors.textMuted,
}))`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md}px;
  height: 100%;
`;

export const ActionButton = styled.TouchableOpacity`
  padding-left: ${({ theme }) => theme.spacing.sm}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
  justify-content: center;
  align-items: center;
`;

export const ActionText = styled.Text`
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;

export const ErrorText = styled.Text`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.sizes.xs}px;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;
