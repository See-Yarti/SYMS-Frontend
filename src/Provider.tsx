// src/Provider.tsx

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { ThemeProvider } from './theme-provider';

// Provider Props
type ProviderProps = { children: React.ReactNode };
// client for queries - single instance for entire app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,              // Always refetch after invalidation
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
const Provider = (props: ProviderProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="yellaride-theme"
    >
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster richColors={true} />
          {props.children}
          {/* <TenStackQueryDevelopmentTools /> */}
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
};

export default Provider;
