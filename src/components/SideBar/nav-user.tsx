import {
  ChevronsUpDown,
  LogOutIcon,
  Settings,
  UserPen,
} from 'lucide-react';
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

  const { user: reduxUser, otherInfo } = useAppSelector((state) => state.auth);
  const email = reduxUser?.email || '';

  // Fetch latest user info from API
  const { data, isLoading, isError } = useGetUserByEmail(email);
  // Use API user if available, fallback to Redux user
  const apiUser = data?.data?.user;
  const user = apiUser || reduxUser;

  // Get role for display
  const getUserRole = () => {
    if (!user) return '';
    const roleRaw = user.role === 'operator' && otherInfo?.operatorRole
      ? otherInfo.operatorRole
      : user.role;
    
    // Format role: camelCase -> "Camel Case" or "Administrator" for admin
    if (roleRaw === 'admin') return 'Administrator';
    if (!roleRaw) return '';
    
    return roleRaw
      .split(/(?=[A-Z])/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayRole = getUserRole();

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
            <div className="w-full px-3 py-2 bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-gray-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FEDE35] text-black font-semibold text-sm flex-shrink-0">
                  {isLoading && !apiUser ? '...' : (user.name?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-black truncate">
                    {isLoading && !apiUser ? "Loading..." : user.name}
                  </div>
                  {displayRole && (
                    <div className="text-xs text-gray-500 truncate">
                      {displayRole}
                    </div>
                  )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FEDE35] text-black font-semibold text-xs">
                  {isLoading && !apiUser ? '...' : (user.name?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {isLoading && !apiUser ? "Loading..." : user.name}
                  </span>
                  <span className="truncate text-xs text-gray-500">{user.email}</span>
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
