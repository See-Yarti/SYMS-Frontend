// src/pages/carclass/CarClass.tsx
import { Outlet, useLocation, Navigate } from 'react-router-dom';

const CarClass = () => {
  const location = useLocation();

  if (location.pathname === '/carclasses') {
    return <Navigate to="/carclasses/list" replace />;
  }

  return (
    <div className="space-y-6">
      <Outlet />
    </div>
  );
};

export default CarClass;
