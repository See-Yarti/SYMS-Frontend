'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

function useQueryParams() {
  const searchParams = useSearchParams();

  return React.useMemo(() => searchParams, [searchParams]);
}

export default useQueryParams;
