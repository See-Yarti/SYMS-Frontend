import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import './index.css';
import { PersistGate } from 'redux-persist/integration/react';
import Provider from './providers/index.tsx';
import { RouterProvider } from 'react-router-dom';
import { persistor, store } from './redux/index.ts';
import router from './routes/index.tsx';

createRoot(document.getElementById('root')!).render(
  <PersistGate loading={null} persistor={persistor}>
    <ReduxProvider store={store}>
      <Provider>
        <RouterProvider router={router} />
      </Provider>
    </ReduxProvider>
  </PersistGate>
);
