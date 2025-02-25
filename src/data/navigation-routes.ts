import { Banknote, Cctv, Home, Inbox, LucideIcon } from 'lucide-react';

type NavigationRoute = {
  title: string;
  slug: string;
  url: string;
  icon: LucideIcon;
  type: 'route';
};

type DropdownNavigationRoute = {
  title: string;
  slug: string;
  type: 'dropdown';
  icon: LucideIcon;
  items: NavigationRoute[];
};

export type TNavigationRoutes = {
  title: string;
  items: (NavigationRoute | DropdownNavigationRoute)[];
};

export const navigationRoutes: TNavigationRoutes[] = [
  {
    title: 'Navigation',
    items: [
      {
        title: 'Home',
        slug: '/',
        url: '/',
        icon: Home,
        type: 'route',
      },
      {
        title: 'Inbox',
        slug: 'inbox',
        url: '/inbox',
        icon: Inbox,
        type: 'route',
      },
      {
        title: 'Attendance',
        slug: 'attendance',
        url: '/attendance',
        icon: Cctv,
        type: 'route',
      },
      {
        title: 'Payroll',
        slug: 'payroll',
        url: '/payroll',
        icon: Banknote,
        type: 'route',
      },
    ],
  },
];
