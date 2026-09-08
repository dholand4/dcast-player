import React, { ReactNode } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { CastProvider } from './CastProvider';

interface IAppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<IAppProvidersProps> = ({ children }) => {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <AuthProvider>
          <CastProvider>{children}</CastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
