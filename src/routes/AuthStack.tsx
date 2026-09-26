import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SetupScreen } from '../view/setupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Só a tela de conexão: telas repetidas aqui fariam o app continuar nelas ao sair da lista
export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="SetupScreen"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="SetupScreen" component={SetupScreen} />
    </Stack.Navigator>
  );
};
