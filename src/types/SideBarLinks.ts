// src/types/SideBarLinks.ts
import {
  Box,
  Layers2,
  Layers3,
  LucideIcon,
  NotebookTabs,
  PanelLeftDashed,
  UsersRound,
  Package,
  PanelRightDashed,
} from 'lucide-react';
import { OperatorRole, UserRole } from './auth';

export type SideBarItem = {
  type: 'separation' | 'routed' | 'dropdown';
  title: string;
  url?: string;
  slug?: string;
  icon?: LucideIcon;
  isHorizontal?: boolean;
  position?: 'bottom' | 'top';
  items?: SideBarItem[];
  badge?: string | number;
  roles?: (UserRole | OperatorRole)[];
};

export type SideBarRoutedItem = SideBarItem & {
  type: 'routed';
  url: string;
};

export type DropdownItem = SideBarItem & {
  type: 'dropdown';
  items: SideBarItem[];
};

export type SeparationItem = SideBarItem & {
  type: 'separation';
};

export const sideBarLinks: SideBarItem[] = [
  {
    type: 'separation',
    title: 'Navigation',
  },
  {
    title: 'Dashboard',
    type: 'routed',
    url: '/',
    slug: '/',
    icon: PanelLeftDashed,
    roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
  },
  {
    title: 'Rate',
    type: 'dropdown',
    slug: 'rate',
    icon: PanelRightDashed,
    roles: ['adminOperator', 'managerOperator', 'salesOperator'],
    items: [], // Empty array, will be filled by API on open
  },

  {
    title: 'CarClasses',
    type: 'routed',
    url: '/carclasses',
    slug: '/carclasses',
    icon: PanelRightDashed,
    roles: ['admin'],
  },
  {
    title: 'Addresses',
    type: 'routed',
    url: '/addresses',
    slug: '/addresses',
    icon: PanelRightDashed,
    roles: ['adminOperator', 'managerOperator', 'salesOperator'],
  },
  {
    title: 'Companies',
    type: 'routed',
    url: '/companies',
    slug: 'companies',
    icon: UsersRound,
    roles: ['admin'],
  },
  {
    title: 'Operators',
    type: 'routed',
    url: '/operators',
    slug: 'operators',
    icon: UsersRound,
    roles: ['admin', 'adminOperator'],
  },
  {
    title: 'Products',
    type: 'routed',
    url: '/products',
    slug: 'products',
    icon: Package,
    roles: ['managerOperator'],
  },
  {
    title: 'Orders',
    type: 'dropdown',
    slug: 'orders',
    icon: NotebookTabs,
    roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
    items: [
      {
        title: 'All Orders',
        slug: 'all-orders',
        url: '/orders/all-orders',
        type: 'routed',
        icon: Layers2,
        roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
      },
      {
        title: 'Pending Orders',
        slug: 'pending-orders',
        url: '/orders/pending-orders',
        type: 'routed',
        icon: Layers3,
        roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
      },
      {
        title: 'Completed Orders',
        slug: 'completed-orders',
        url: '/orders/completed-orders',
        type: 'routed',
        icon: Layers3,
        roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
      },
      {
        title: 'Returns & Refunds',
        slug: 'returns-refunds',
        url: '/orders/returns-refunds',
        type: 'routed',
        icon: Layers2,
        roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
      },
    ],
  },
  {
    type: 'separation',
    title: 'Management',
    roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
  },
  {
    title: 'User Management',
    type: 'dropdown',
    slug: 'user-management',
    icon: UsersRound,
    roles: ['admin'],
    items: [
      {
        title: 'All Users',
        slug: 'all-users',
        url: '/user-management/all-users',
        type: 'routed',
        icon: Layers2,
        roles: ['admin'],
      },
      {
        title: 'Roles & Permissions',
        slug: 'roles-permissions',
        url: '/user-management/roles-permissions',
        type: 'routed',
        icon: Layers3,
        roles: ['admin'],
      },
      {
        title: 'Access Logs',
        slug: 'access-logs',
        url: '/user-management/access-logs',
        type: 'routed',
        icon: Box,
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'Operator Management',
    type: 'dropdown',
    slug: 'operator-management',
    icon: UsersRound,
    roles: ['adminOperator', 'managerOperator', 'accountantOperator', 'salesOperator'],
    items: [
      {
        title: 'Operator Dashboard',
        slug: 'operator-dashboard',
        url: '/operator-management/dashboard',
        type: 'routed',
        icon: Layers2,
        roles: ['adminOperator', 'managerOperator', 'accountantOperator', 'salesOperator'],
      },
      {
        title: 'Performance Metrics',
        slug: 'performance-metrics',
        url: '/operator-management/metrics',
        type: 'routed',
        icon: Layers3,
        roles: ['adminOperator', 'managerOperator', 'accountantOperator', 'salesOperator'],
      },
      {
        title: 'Bookings',
        slug: 'operator-bookings',
        url: '/operators/bookings',
        type: 'routed',
        icon: NotebookTabs,
        roles: ['adminOperator', 'managerOperator', 'accountantOperator', 'salesOperator'],
      },
    ],
  },
  {
    type: 'separation',
    title: 'Settings & Support',
  },
  {
    title: 'Settings',
    type: 'routed',
    url: '/settings',
    slug: 'settings',
    icon: Box,
    roles: ['admin', 'adminOperator', 'managerOperator', 'salesOperator'],
  },
];
