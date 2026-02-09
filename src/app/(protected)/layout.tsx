'use client';

import SideBar from '@/components/SideBar';
import ProtectedRoute from '@/components/ProtectedRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SideBar>{children}</SideBar>
    </ProtectedRoute>
  );
}
