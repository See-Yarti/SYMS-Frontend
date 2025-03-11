import * as React from 'react';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Layers2,
  Layers3,
  LucideIcon,
  NotebookTabs,
  PanelLeftDashed,
  UsersRound,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { User } from '@/types/user';
import { NavUser } from './nav-user';

type SideBarRoutedItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  slug: string;
  type: 'routed';
};

type DropdownItem = {
  title: string;
  slug: string;
  icon: LucideIcon;
  type: 'dropdown';
  items: (SideBarRoutedItem | DropdownItem)[]; // Can contain both
};

const sideBarlinks: (DropdownItem | SideBarRoutedItem)[] = [
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const firstIndex = location.pathname.split('/')[1] || '/';
  const { email, name } = useAppSelector((state) => state.auth.user) as User;

  // Stack to track multi-level navigation
  const [selectedPath, setSelectedPath] = React.useState<number[]>([]);

  // Get the current menu level based on selectedPath
  let currentMenu: (DropdownItem | SideBarRoutedItem)[] = sideBarlinks;
  for (const index of selectedPath) {
    if (currentMenu[index] && currentMenu[index].type === 'dropdown') {
      currentMenu = (currentMenu[index] as DropdownItem).items;
    } else {
      break;
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu></SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarMenu className="gap-2">
            {/* Show Back Button if Inside a Nested Menu */}
            {selectedPath.length > 0 && (
              <SidebarMenuItem className=''>
                <SidebarMenuButton
                  className="font-medium"
                  onClick={() => setSelectedPath(selectedPath.slice(0, -1))}
                >
                  <ChevronLeft className="transition-transform duration-200" />
                  Back
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* Render Current Level Menu */}
            {currentMenu.map((item, index) =>
              item.type === 'routed' ? (
                <SidebarMenuSubItem key={item.title} className='px-1'>
                  <SidebarMenuButton tooltip={item.title} className='text-sm'>
                    <Link
                      to={item.url}
                      className="flex w-full items-center gap-2"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              ) : (
                <SidebarMenuSubItem key={item.title} className='px-1'>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setSelectedPath([...selectedPath, index])} // Navigate deeper
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 w-4 h-4" />
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: name,
            email: email,
            avatar: '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
