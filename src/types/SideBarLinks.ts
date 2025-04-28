// src/types/SideBarLinks.ts
import {
  Box,
  Layers2,
  Layers3,
  LucideIcon,
  NotebookTabs,
  PanelLeftDashed,
  UsersRound,
  Package
} from 'lucide-react';

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
  roles?: ('admin' | 'operator')[];
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
    roles: ['admin', 'operator']
  },
  {
    title: 'Operators',
    type: 'routed',
    url: '/operators',
    slug: 'operators',
    icon: UsersRound,
    roles: ['admin']
  },
  {
    title: 'Cars',
    type: 'routed',
    url: '/products',
    slug: 'products',
    icon: Package,
    roles: ['admin', 'operator']
  },
  {
    title: 'Orders',
    type: 'dropdown',
    slug: 'orders',
    icon: NotebookTabs,
    roles: ['admin', 'operator'],
    items: [
      {
        title: 'All Orders',
        slug: 'all-orders',
        url: '/orders/all-orders',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Pending Orders',
        slug: 'pending-orders',
        url: '/orders/pending-orders',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Completed Orders',
        slug: 'completed-orders',
        url: '/orders/completed-orders',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Returns & Refunds',
        slug: 'returns-refunds',
        url: '/orders/returns-refunds',
        type: 'routed',
        icon: Layers2,
      },
    ],
  },
  {
    type: 'separation',
    title: 'Management',
    roles: ['admin']
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
      },
      {
        title: 'Roles & Permissions',
        slug: 'roles-permissions',
        url: '/user-management/roles-permissions',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Access Logs',
        slug: 'access-logs',
        url: '/user-management/access-logs',
        type: 'routed',
        icon: Box,
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
    roles: ['admin', 'operator']
  },
  {
    title: 'Help Center',
    type: 'routed',
    url: '/help',
    slug: 'help',
    icon: NotebookTabs,
    roles: ['admin', 'operator']
  },
];