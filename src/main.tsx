import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { NotifyProvider } from './components/ui/Notify';
import { JobProgressProvider } from './components/ui/JobProgress';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotifyProvider>
      <JobProgressProvider>
        <App />
      </JobProgressProvider>
    </NotifyProvider>
  </StrictMode>,
);
