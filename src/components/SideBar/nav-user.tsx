import {
  LogOutIcon,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/features/auth.slice';
import { useGetUserByEmail } from '@/hooks/useOperatorApi';

export function NavUser() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user: reduxUser, otherInfo } = useAppSelector((state) => state.auth);
  const email = reduxUser?.email || '';

  // Fetch latest user info from API
  const { data, isLoading } = useGetUserByEmail(email);
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
        <div className="w-full py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F97316] text-white font-semibold text-sm flex-shrink-0">
                {isLoading && !apiUser ? '...' : (user.name?.charAt(0)?.toUpperCase() || 'U')}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-foreground truncate">
                  {isLoading && !apiUser ? "Loading..." : user.name}
                </div>
                {displayRole && (
                  <div className="text-xs text-muted-foreground truncate">
                    {displayRole}
                  </div>
                )}
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}