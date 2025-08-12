import {
  ChevronsUpDown,
  LogOutIcon,
  Settings,
  UserPen,
} from 'lucide-react';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { useGetUserByEmail } from '@/hooks/useOperatorApi';

export function NavUser() {
  const { isMobile } = useSidebar();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user: reduxUser } = useAppSelector((state) => state.auth);
  const email = reduxUser?.email || '';

  // Fetch latest user info from API
  const { data, isLoading, isError } = useGetUserByEmail(email);
  // Use API user if available, fallback to Redux user
  const apiUser = data?.data?.user;
  const user = apiUser || reduxUser;

  const handleLogout = async () => {
    try {
      localStorage.removeItem('persist:root');
      await dispatch(logoutUser()).unwrap();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
                <AvatarImage src={user.avatar || "/images/logo.svg"} alt={user.name} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {isLoading && !apiUser ? "Loading..." : user.name}
                </span>
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
                  <AvatarImage src={user.avatar || "/images/logo.svg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {isLoading && !apiUser ? "Loading..." : user.name}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isError && (
              <div className="px-3 py-1 text-xs text-red-600">
                Failed to fetch latest user data. Showing stored info.
              </div>
            )}
            <DropdownMenuGroup>
              <Link to={'/settings/profile-update'} className="w-full">
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
