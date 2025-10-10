// src/Router.tsx:

import { createBrowserRouter, Navigate } from 'react-router-dom';
import ErrorPage from './error-page';
import SideBar from './components/SideBar';
import Login from './pages/auth/login/Login';
import PublicRoute from './PublicRoute';
import Home from './pages/Home';
import ProtectedRoute from './ProtectedRoute';
import Register from './pages/auth/register/Register';
import Operators from './pages/operators/Operators';
import OperatorBookings from './pages/operators/OperatorBookings';
import Profile from './pages/settings/profile-update';
import Products from './pages/products/Products';
import CompaniesList from '@/components/Company/CompanyList';
import CompanyDetail from '@/components/Company/CompanyDetails';
import Companies from './pages/company/Companies';
import Addresses from './pages/addresses/Addresses';
import CompanyFormWrapper from './components/Company/CompanyFormWrapper';
import OperatorRegister from './pages/operators/OperatorRegister';
import ProfileUpdate from './pages/settings/profile-update';
import SettingsSidebar from './pages/settings/Sidebar';
import Appearance from './pages/settings/Appearance';
import PasswordChanges from './pages/settings/password-changes';
import CarClass from './pages/carclass/CarClass';
import CarClassList from './pages/carclass/CarClassList';
import Rate from './pages/rate/RatesLayout';
import RatesPage from './pages/rate/RatesPage';
import RatePlannerPage from './pages/rate/RatePlanner';
import BlackoutPage from './pages/rate/BlackoutPage';
import CarClassesPage from './pages/rate/CarClassesPage';
import TaxesPage from './pages/rate/TaxesPage';

const router = createBrowserRouter([
  {
    element: <ProtectedRoute to={'/auth/login'} replace={true} />,
    children: [
      {
        path: '/',
        element: <SideBar />,
        errorElement: <ErrorPage />,
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: 'addresses',
            element: <Addresses />,
          },
          {
            path: 'dashboard',
            element: <Home />,
          },
          {
            path: 'profile',
            element: <Profile />,
          },
          {
            path: 'operators',
            element: <Operators />,
          },
          {
            path: '/operators/bookings',
            element: <OperatorBookings />,
          },
          {
            path: '/operators/register',
            element: <OperatorRegister />,
          },
          {
            path: 'products',
            element: <Products />,
          },
          {
            path: '/settings',
            element: <SettingsSidebar />,
            children: [
              {
                path: '',
                element: <Appearance />,
              },
              {
                path: 'profile-update',
                element: <ProfileUpdate />,
              },
              {
                path: 'password-changes',
                element: <PasswordChanges />,
              },
            ],
          },
          {
            path: 'companies',
            element: <Companies />,
            children: [
              {
                index: true,
                element: <Navigate to="list" replace />,
              },
              {
                path: 'list',
                element: <CompaniesList />,
              },
              {
                path: 'new',
                element: <CompanyFormWrapper />,
              },
              {
                path: ':companyId',
                element: <CompanyDetail />,
              },
            ],
          },
          {
            path: 'carclasses',
            element: <CarClass />,
            children: [
              { index: true, element: <Navigate to="list" replace /> },
              { path: 'list', element: <CarClassList /> },
            ],
          },
          {
            path: 'rate',
            element: <Rate />,
            children: [
              { path: ':locationId', element: <RatesPage /> },
              { path: ':locationId/planner', element: <RatePlannerPage /> },
              { path: ':locationId/blackouts', element: <BlackoutPage /> },
              { path: ':locationId/car-classes', element: <CarClassesPage /> },
              { path: ':locationId/taxes', element: <TaxesPage /> },
            ],
          }
        ],
      },
    ],
  },
  {
    element: <PublicRoute to={'/auth/login'} replace={true} />,
    children: [
      {
        path: '/auth/login',
        element: <Login />,
      },
    ],
  },
  {
    element: <PublicRoute to={'register'} replace={true} />,
    children: [
      {
        path: 'register',
        element: <Register />,
      },
    ],
  },
]);
export default router;