'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { _aT } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!_aT) {
      router.replace('/auth/login');
    }
  }, [_aT, router]);

  if (!_aT) {
    return null;
  }

  return <>{children}</>;
}
