import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { createQueryClient } from './app/query-client';
import { AuthProvider } from './features/auth/AuthProvider';
import { AuthPanel } from './features/auth/AuthPanel';
import './styles.css';

const queryClient = createQueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Theme
        accentColor="blue"
        grayColor="slate"
        radius="large"
        appearance="light"
      >
        <AuthProvider>
          <App account={<AuthPanel />} />
        </AuthProvider>
      </Theme>
    </QueryClientProvider>
  </StrictMode>,
);
