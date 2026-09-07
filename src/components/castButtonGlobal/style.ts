import styled from 'styled-components/native';
import { CastButton } from 'react-native-google-cast';

export const CastContainer = styled.View`
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
`;

export const StyledCastButton = styled(CastButton)<{ tintColor?: string }>`
  width: 24px;
  height: 24px;
  tint-color: ${({ tintColor, theme }) => tintColor || theme.colors.text};
`;

export const CastPressable = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
`;
