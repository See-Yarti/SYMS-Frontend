'use client';

// src/pages/rate/Rate.tsx

import RateMenuBar from './RateMenuBar';

export default function Rate({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <RateMenuBar />
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}
