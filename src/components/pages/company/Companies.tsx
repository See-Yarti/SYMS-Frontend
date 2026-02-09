'use client';

// src/pages/Companies.tsx
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from '@/hooks/useNextNavigation';

const Companies = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current route
  const getActiveTab = useCallback(() => {
    if (location.pathname.includes('companies/list')) return 'list';
    if (location.pathname.match(/\/companies\/[^/]+$/)) return 'details';
    if (location.pathname.includes('companies/new')) return 'new';
    if (location.pathname === '/companies') return 'list';
    return 'list';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Sync tab state with URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname, getActiveTab]);

  return <div>{children}</div>;
};

export default Companies;
