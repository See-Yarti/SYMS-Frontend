// src/components/SideBar/nav-user.tsx:

import {
  ChevronsUpDown,
  LogOutIcon,
  Settings,
  UserPen,
} from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/features/auth.slice';

export function NavUser() {
  const { isMobile } = useSidebar();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <div>Loading user data...</div>;
  }


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar>
                {user.avatar ? (
                  <img
                    src={user.avatar || "images/logo.svg"}
                    alt={user.name}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar>
                  {user.avatar ? (
                    <img
                      src={user.avatar || "images/logo.svg"}
                      alt={user.name}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to={'/profile'} className="w-full">
                <DropdownMenuItem>
                  <UserPen className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link to={'/settings'} className="w-full">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Setting
                </DropdownMenuItem>
              </Link>

              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <React.Suspense>
            </React.Suspense>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}