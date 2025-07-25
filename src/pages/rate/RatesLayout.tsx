// src/pages/rate/Rate.tsx

import { Outlet } from 'react-router-dom';
import RateMenuBar from './RateMenuBar';

export default function Rate() {
  return (
    <div>
      <RateMenuBar />
      <div style={{ padding: 24 }}>
        <Outlet />
      </div>
    </div>
  );
}
