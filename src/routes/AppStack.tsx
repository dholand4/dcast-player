import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../view/homeScreen';
import { CategoryScreen } from '../view/categoryScreen';
import { DetailsScreen } from '../view/detailsScreen';
import { PlayerScreen } from '../view/playerScreen';
import { SetupScreen } from '../view/setupScreen';
import { SearchScreen } from '../view/searchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
      <Stack.Screen name="DetailsScreen" component={DetailsScreen} />
      <Stack.Screen
        name="PlayerScreen"
        component={PlayerScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="SetupScreen" component={SetupScreen} />
    </Stack.Navigator>
  );
};
