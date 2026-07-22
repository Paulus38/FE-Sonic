import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { NotifyProvider } from './components/ui/Notify';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotifyProvider>
      <App />
    </NotifyProvider>
  </StrictMode>,
);
