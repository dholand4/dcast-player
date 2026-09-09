import styled from 'styled-components/native';

export const Overlay = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.overlayDark};
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md}px;
`;

export const ModalCard = styled.View`
  width: 100%;
  max-width: 400px;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg}px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.6;
  shadow-radius: 16px;
  elevation: 12;
`;

export const IconBadge = styled.View<{ bgColor: string }>`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${({ bgColor }) => bgColor};
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.lg}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs + 2}px;
`;

export const Description = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  text-align: center;
  line-height: 20px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  padding-horizontal: ${({ theme }) => theme.spacing.xs}px;
`;

export const ActionsRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
  width: 100%;
`;

export const CancelButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding-vertical: 12px;
  align-items: center;
  justify-content: center;
`;

export const CancelButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;

export const ConfirmButton = styled.TouchableOpacity<{ btnColor: string }>`
  flex: 1;
  background-color: ${({ btnColor }) => btnColor};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding-vertical: 12px;
  align-items: center;
  justify-content: center;
`;

export const ConfirmButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.sizes.sm}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;
