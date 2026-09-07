import React from 'react';
import { ILoadingGlobalProps } from './types';
import { Container, StyledSpinner, MessageText } from './style';

export const LoadingGlobal: React.FC<ILoadingGlobalProps> = ({
  message,
  fullscreen = false,
  testID,
}) => {
  return (
    <Container fullscreen={fullscreen} testID={testID}>
      <StyledSpinner testID="loading-spinner" />
      {message && <MessageText>{message}</MessageText>}
    </Container>
  );
};
