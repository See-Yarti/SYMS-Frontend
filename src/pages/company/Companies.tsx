// src/pages/Companies.tsx
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';

const Companies = () => {
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

  // If user lands on /companies, redirect to /companies/list
  if (location.pathname === '/companies') {
    return <Navigate to="/companies/list" replace />;
  }

  return <Outlet context={{ activeTab, navigate }} />;
};

export default Companies;
