// src/Router.tsx:

import { createBrowserRouter, Navigate } from 'react-router-dom';
import ErrorPage from './error-page';
import SideBar from './components/SideBar';
import Login from './pages/auth/login/Login';
import PublicRoute from './PublicRoute';
import Home from './pages/Home';
import ProtectedRoute from './ProtectedRoute';
import Register from './pages/auth/register/Register';
import OperatorRegister from './pages/operators/register/Register';
import Operators from './pages/operators/Operators';
import Products from './pages/products/Products';
import CompaniesList from '@/components/Company/CompanyList';
import CompanyDetail from '@/components/Company/CompanyDetails';
import Companies from './pages/company/Companies';
import CompanyFormWrapper from './components/Company/CompanyFormWrapper';

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
            path: 'dashboard',
            element: <Home />,
          },
          {
            path: 'operators',
            element: <Operators />,
          },
          {
            path: 'products',
            element: <Products />,
          },
          {
            path: 'operatorsregister',
            element: <OperatorRegister />,
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