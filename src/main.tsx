// src/main.tsx

import { createRoot } from 'react-dom/client';
import './index.css';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as ReduxProvider } from 'react-redux';
import { persistor, store } from './store/index.ts';
import router from './Router.tsx';
import { RouterProvider } from 'react-router-dom';
import Provider from './Provider.tsx';
import { initializeTokenRefresh } from './lib/API.ts';

createRoot(document.getElementById('root')!).render(
    <PersistGate 
      loading={null} 
      persistor={persistor}
      onBeforeLift={() => {
        // Initialize token refresh after Redux state is rehydrated
        initializeTokenRefresh();
      }}
    >
      <ReduxProvider store={store}>
        <Provider>
          <RouterProvider router={router} />
        </Provider>
      </ReduxProvider>
    </PersistGate>
);
