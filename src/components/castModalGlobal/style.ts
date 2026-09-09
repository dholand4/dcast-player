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
  max-width: 440px;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg}px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.6;
  shadow-radius: 16px;
  elevation: 12;
`;

export const ModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const HeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

export const HeaderIconBadge = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(41, 182, 246, 0.15);
  align-items: center;
  justify-content: center;
`;

export const HeaderTextContainer = styled.View`
  flex: 1;
`;

export const HeaderTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.sizes.md + 1}px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const HeaderSubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  margin-top: 1px;
`;

export const CloseButton = styled.TouchableOpacity`
  padding: 6px;
  border-radius: ${({ theme }) => theme.radii.round}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
`;

export const BodySection = styled.View`
  align-items: center;
  justify-content: center;
  padding-vertical: ${({ theme }) => theme.spacing.md}px;
`;

export const RadarCircle = styled.View`
  width: 68px;
  height: 68px;
  border-radius: 34px;
  background-color: rgba(41, 182, 246, 0.12);
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const ConnectedCircle = styled.View`
  width: 68px;
  height: 68px;
  border-radius: 34px;
  background-color: rgba(70, 211, 105, 0.15);
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

export const StatusTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
  text-align: center;
`;

export const StatusSubtitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
`;

export const MediaBox = styled.View`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: 10px 12px;
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

export const MediaBoxLabel = styled.Text`
  color: #46D369;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const MediaBoxTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;
`;

export const InfoCard = styled.View`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
  padding: 12px;
  margin-top: ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
`;

export const InfoTextContainer = styled.View`
  flex: 1;
`;

export const InfoTitle = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;

export const InfoDescription = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  line-height: 16px;
  margin-top: 2px;
`;

export const ActionsContainer = styled.View`
  width: 100%;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme }) => theme.spacing.lg}px;
`;

export const PrimaryButton = styled.TouchableOpacity<{ btnColor?: string }>`
  background-color: ${({ btnColor }) => btnColor || '#29B6F6'};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding-vertical: 13px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const PrimaryButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const SecondaryButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding-vertical: 12px;
  align-items: center;
  justify-content: center;
`;

export const SecondaryButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.semiBold};
`;
