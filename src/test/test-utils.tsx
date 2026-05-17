import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

/**
 * Creates a fresh QueryClient per test with retries disabled so that
 * error states resolve immediately instead of retrying.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

const AllProviders = ({ children, queryClient }: AllProvidersProps) => {
  const client = queryClient ?? createTestQueryClient();
  return (
    <BrowserRouter>
      <HelmetProvider>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render that wraps the component in the providers the app needs
 * (Router, Helmet, TanStack Query). Returns the standard RTL result plus
 * the queryClient used so tests can inspect/invalidate cache.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { queryClient, ...options }: CustomRenderOptions = {}
) => {
  const client = queryClient ?? createTestQueryClient();
  const result = render(ui, {
    wrapper: ({ children }) => <AllProviders queryClient={client}>{children}</AllProviders>,
    ...options,
  });
  return { ...result, queryClient: client };
};

// Re-export everything from RTL so tests have a single import source.
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
