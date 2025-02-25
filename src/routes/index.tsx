import SideBarLayout from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Inbox from '@/pages/Inbox';
import ErrorPage from '@/utils/common/pages/error-page';
import NotFound from '@/utils/common/pages/not-found';
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    children: [
      {
        path: '/',
        element: <SideBarLayout />,
        errorElement: <ErrorPage />,
        children: [
          {
            path: '/',
            element: <Dashboard />,
          },
          {
            path: '/inbox',
            element: <Inbox />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFound/>,
      }
    ],
  },
]);
export default router;
