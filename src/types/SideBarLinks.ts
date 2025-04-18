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

export type DynamicProductTypeItem = {
  title: string;
  slug: string;
  type: 'dynamic-product-type';
  icon: LucideIcon;
  items: DynamicCategoryItem[];
};

export type DynamicCategoryItem = {
  title: string;
  slug: string;
  type: 'dynamic-category';
  productTypeSlug: string;
  items?: DynamicSubCategoryItem[];
};

export type DynamicSubCategoryItem = {
  title: string;
  slug: string;
  type: 'dynamic-subcategory';
  categorySlug: string;
  productTypeSlug: string;
};

export const sideBarLinks: (
  | DropdownItem
  | SideBarRoutedItem
  | SeparationItem
  | DynamicProductTypeItem
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
    title: 'Vendors',
    type: 'routed',
    url: '/vendors',
    slug: 'vendors',
    icon: UsersRound,
  },
  {
    title: 'Product Types',
    type: 'dynamic-product-type',
    slug: 'product-types',
    icon: Package,
    items: [], // Will be populated dynamically
  },
  // {
  //   title: 'Catalog',
  //   type: 'dropdown',
  //   slug: 'catalog',
  //   icon: NotebookTabs,
  //   items: [
  //     {
  //       title: 'Categories',
  //       slug: 'categories',
  //       url: '/catalog/categories',
  //       type: 'routed',
  //       icon: Layers2,
  //     },
  //     {
  //       title: 'Sub Categories',
  //       slug: 'sub-categories',
  //       url: '/catalog/sub-categories',
  //       type: 'routed',
  //       icon: Layers3,
  //     },
  //     {
  //       title: 'Products',
  //       slug: 'products',
  //       type: 'dropdown',
  //       icon: Box,
  //       items: [
  //         {
  //           title: 'New Arrivals',
  //           slug: 'new-arrivals',
  //           url: '/catalog/products/new-arrivals',
  //           type: 'routed',
  //           icon: Layers2,
  //         },
  //         {
  //           title: 'Best Sellers',
  //           slug: 'best-sellers',
  //           url: '/catalog/products/best-sellers',
  //           type: 'routed',
  //           icon: Layers3,
  //         },
  //         {
  //           title: 'Discounted Items',
  //           slug: 'discounted-items',
  //           url: '/catalog/products/discounted-items',
  //           type: 'routed',
  //           icon: Layers2,
  //         },
  //         {
  //           title: 'Featured Products',
  //           slug: 'featured-products',
  //           url: '/catalog/products/featured-products',
  //           type: 'routed',
  //           icon: Box,
  //         },
  //       ],
  //     },
  //   ],
  // },
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
    title: 'Customers',
    type: 'dropdown',
    slug: 'customers',
    icon: UsersRound,
    items: [
      {
        title: 'All Customers',
        slug: 'all-customers',
        url: '/customers/all-customers',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Loyalty Program',
        slug: 'loyalty-program',
        url: '/customers/loyalty-program',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Customer Feedback',
        slug: 'customer-feedback',
        url: '/customers/feedback',
        type: 'routed',
        icon: Box,
      },
    ],
  },
  {
    title: 'Analytics',
    type: 'dropdown',
    slug: 'analytics',
    icon: NotebookTabs,
    items: [
      {
        title: 'Sales Reports',
        slug: 'sales-reports',
        url: '/analytics/sales-reports',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Customer Insights',
        slug: 'customer-insights',
        url: '/analytics/customer-insights',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Revenue Trends',
        slug: 'revenue-trends',
        url: '/analytics/revenue-trends',
        type: 'routed',
        icon: Box,
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
    title: 'Marketing',
    type: 'dropdown',
    slug: 'marketing',
    icon: NotebookTabs,
    items: [
      {
        title: 'Campaigns',
        slug: 'campaigns',
        url: '/marketing/campaigns',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Email Marketing',
        slug: 'email-marketing',
        url: '/marketing/email-marketing',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'SEO Optimization',
        slug: 'seo-optimization',
        url: '/marketing/seo-optimization',
        type: 'routed',
        icon: Box,
      },
    ],
  },
  {
    title: 'Finance',
    type: 'dropdown',
    slug: 'finance',
    icon: NotebookTabs,
    items: [
      {
        title: 'Invoices',
        slug: 'invoices',
        url: '/finance/invoices',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Payments',
        slug: 'payments',
        url: '/finance/payments',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Tax Reports',
        slug: 'tax-reports',
        url: '/finance/tax-reports',
        type: 'routed',
        icon: Box,
      },
    ],
  },
  {
    title: 'Logistics',
    type: 'dropdown',
    slug: 'logistics',
    icon: NotebookTabs,
    items: [
      {
        title: 'Shipping',
        slug: 'shipping',
        url: '/logistics/shipping',
        type: 'routed',
        icon: Layers2,
      },
      {
        title: 'Tracking',
        slug: 'tracking',
        url: '/logistics/tracking',
        type: 'routed',
        icon: Layers3,
      },
      {
        title: 'Warehouse',
        slug: 'warehouse',
        url: '/logistics/warehouse',
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