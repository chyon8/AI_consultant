import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AsyncStateProvider } from './contexts/AsyncStateContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AsyncStateProvider>
      <App />
    </AsyncStateProvider>
  </React.StrictMode>
);