'use client';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../theme-provider';
import { store, persistor } from '../store';
import { initializeTokenRefresh } from '../api/client';

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PersistGate
      loading={null}
      persistor={persistor}
      onBeforeLift={() => {
        // Initialize token refresh after Redux state is rehydrated
        initializeTokenRefresh();
      }}
    >
      <ReduxProvider store={store}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="yellaride-theme"
        >
          <HelmetProvider>
            <QueryClientProvider client={queryClient}>
              <Toaster richColors={true} />
              {children}
            </QueryClientProvider>
          </HelmetProvider>
        </ThemeProvider>
      </ReduxProvider>
    </PersistGate>
  );
}
