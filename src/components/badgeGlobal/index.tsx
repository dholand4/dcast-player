import React from 'react';
import { IBadgeGlobalProps } from './types';
import { BadgeContainer, BadgeText } from './style';

export const BadgeGlobal: React.FC<IBadgeGlobalProps> = ({
  text,
  variant = 'default',
  testID,
}) => {
  return (
    <BadgeContainer variant={variant} testID={testID}>
      <BadgeText variant={variant}>{text}</BadgeText>
    </BadgeContainer>
  );
};
