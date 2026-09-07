import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SetupScreen } from '../view/setupScreen';
import { HomeScreen } from '../view/homeScreen';
import { CategoryScreen } from '../view/categoryScreen';
import { DetailsScreen } from '../view/detailsScreen';
import { PlayerScreen } from '../view/playerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
      <Stack.Screen name="DetailsScreen" component={DetailsScreen} />
      <Stack.Screen
        name="PlayerScreen"
        component={PlayerScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};
