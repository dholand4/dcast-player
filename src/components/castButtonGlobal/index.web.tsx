import React from 'react';
import { View } from 'react-native';
import { ICastButtonGlobalProps } from './types';

export const CastButtonGlobal: React.FC<ICastButtonGlobalProps> = ({ testID }) => {
  // No-op na Web: O Google Chrome já possui o botão nativo de Transmitir no menu do navegador
  return <View testID={testID} style={{ width: 0, height: 0 }} />;
};
