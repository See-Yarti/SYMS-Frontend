// Compatibility hook to bridge Next.js navigation with existing code
'use client';

import {
  useParams as useNextParams,
  usePathname,
  useRouter as useNextRouter,
  useSearchParams,
} from 'next/navigation';
import { useMemo } from 'react';

// Hook that mimics react-router-dom's useParams
export function useParams<T = Record<string, string>>(): T {
  return useNextParams() as T;
}

// Hook that mimics react-router-dom's useNavigate
export function useNavigate() {
  const router = useNextRouter();

  return (
    to: string | number,
    options?: { replace?: boolean; state?: any },
  ) => {
    if (typeof to === 'number') {
      // Handle back/forward navigation
      if (to === -1) router.back();
      else if (to === 1) router.forward();
      return;
    }

    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

// Hook that mimics react-router-dom's useLocation
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const searchString = searchParams?.toString() || '';
    return {
      pathname: pathname || '',
      search: searchString ? `?${searchString}` : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      state: null,
      key: 'default',
    };
  }, [pathname, searchParams]);
}

// Re-export useSearchParams for convenience
export { useSearchParams };
