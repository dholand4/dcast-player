import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppProviders } from '../../providers';
import { AppStack } from '../AppStack';

describe('AppStack rendering', () => {
  it('renders AppStack with NavigationContainer without crashing', () => {
    const { toJSON } = render(
      <AppProviders>
        <NavigationContainer>
          <AppStack />
        </NavigationContainer>
      </AppProviders>
    );
    expect(toJSON()).toBeTruthy();
  });
});
