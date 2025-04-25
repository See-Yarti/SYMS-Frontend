import { createBrowserRouter } from 'react-router-dom';
import ErrorPage from './error-page';
import SideBar from './components/SideBar';
import Login from './pages/auth/login/Login';
import PublicRoute from './PublicRoute';
import Home from './pages/Home';
import ProtectedRoute from './ProtectedRoute';
import Register from './pages/auth/register/Register';
import OperatorRegister from './pages/operators/register/Register';
import Operators from './pages/operators/Operators';

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
            path: 'operatorsregister',
            element: <OperatorRegister />,
          },
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