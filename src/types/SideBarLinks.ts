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

export type SideBarRoutedItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  slug: string;
  type: 'routed';
};

export type DropdownItem = {
  title: string;
  slug: string;
  icon: LucideIcon;
  type: 'dropdown';
  items: (SideBarRoutedItem | DropdownItem)[];
};

export type SeparationItem = {
  type: 'separation';
  title: string;
  isHorizontal?: boolean;
  position?: 'bottom' | 'top';
};

export const sideBarLinks: (
  | DropdownItem
  | SideBarRoutedItem
  | SeparationItem
)[] = [

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
  },
  {
    title: 'Operators',
    type: 'routed',
    url: '/operators',
    slug: 'operators',
    icon: UsersRound,
  },
  {
    title: 'Cars',
    type: 'routed',
    url: '/products',
    slug: 'products',
    icon: Package,
  },
  {
    title: 'Orders',
    type: 'dropdown',
    slug: 'orders',
    icon: NotebookTabs,
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
  },
  {
    title: 'User Management',
    type: 'dropdown',
    slug: 'user-management',
    icon: UsersRound,
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
  },
  {
    title: 'Help Center',
    type: 'routed',
    url: '/help',
    slug: 'help',
    icon: NotebookTabs,
  },
];