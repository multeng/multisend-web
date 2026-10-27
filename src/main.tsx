import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import { App } from './app/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme
      accentColor="blue"
      grayColor="slate"
      radius="large"
      appearance="light"
    >
      <App />
    </Theme>
  </StrictMode>,
);
