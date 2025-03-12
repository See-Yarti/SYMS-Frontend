import {
  Box,
  Layers2,
  Layers3,
  LucideIcon,
  NotebookTabs,
  PanelLeftDashed,
  UsersRound,
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
  items: (SideBarRoutedItem | DropdownItem)[]; // Can contain both
};

export type SeparationItem = {
  type: "separation";
  title: string;
  isHorizontal?: boolean;
  position?: 'bottom' | 'top';
};

export const sideBarLinks: (DropdownItem | SideBarRoutedItem | SeparationItem)[] = [
  {
    type: "separation",
    title: "Navigation",
  },
  {
    title: 'Dashboard',
    type: 'routed',
    url: '/',
    slug: '/',
    icon: PanelLeftDashed,
  },
  {
    title: 'Vendors',
    type: 'routed',
    url: '/vendors',
    slug: 'vendors',
    icon: UsersRound,
  },
  {
    title: 'Catalog',
    type: 'dropdown',
    slug: 'catalog',
    icon: NotebookTabs,
    items: [
      {
        title: 'Categories',
        slug: 'categories',
        url: '/catalog/categories',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Sub Categories',
        slug: 'sub-categories',
        url: '/catalog/sub-categories',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Products',
        slug: 'products',
        type: 'dropdown', // Nested dropdown inside 'Catalog'
        icon: Box,
        items: [
          {
            title: 'New Arrivals',
            slug: 'new-arrivals',
            url: '/catalog/products/new-arrivals',
            type: 'routed',
            icon: Layers2,
          },
          {
            title: 'Best Sellers',
            slug: 'best-sellers',
            url: '/catalog/products/best-sellers',
            type: 'routed',
            icon: Layers3,
          },
        ],
      },
    ],
  },
  {
    type: "separation",
    title: "Helpful Links",
    isHorizontal: true,
    position: 'top',
  },
  {
    title: 'Settings',
    type: 'dropdown',
    slug: 'settings',
    icon: Box,
    items: [
      {
        title: 'Appearance',
        slug: 'appearance',
        url: '/setting/appearance',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Profile Changes',
        slug: 'profile-changes',
        url: '/setting/profile-changes',
        type: 'routed',
        icon: Layers3,
      },
    ],
  },
];
