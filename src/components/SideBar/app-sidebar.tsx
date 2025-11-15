// src/components/SideBar/app-sidebar.tsx

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SidebarMenu } from '@/components/ui/sidebar';
import { useAppSelector } from '@/store';
import { NavUser } from './nav-user';
import { sideBarLinks } from '@/types/SideBarLinks';
import { SidebarBackButton } from './sidebar-back-button';
import { Command, Sparkles, PanelRightDashed } from 'lucide-react';
import { SidebarMenuItems } from './sidebar-menu-items';
import { ScrollArea } from '../ui/scroll-area';
import { TooltipProvider } from '../ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';
import { useFilteredMenu } from '@/hooks/useFilteredMenu';
import { useGetActiveLocations } from '@/hooks/useLocationApi';
import { useGetUserByEmail } from '@/hooks/useOperatorApi'; // <-- This is the key line

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Auth info
  const { user: authUser, otherInfo } = useAppSelector((state) => state.auth);
  const email = authUser?.email || '';
  const companyId = otherInfo?.companyId || '';

  // Fetch user from API, not just redux
  const {
    data: userData,
    isLoading: userLoading,
    isError: userError  } = useGetUserByEmail(email);

  const user = userData?.data?.user;

  // Get active locations for Rate menu
  const {
    data: locationData,
    isLoading: locationsLoading,
    isError: locationsError,
    refetch: refetchLocations,
  } = useGetActiveLocations(companyId);

  // Sidebar links: Always recreate a fresh copy on data change
  const links = React.useMemo(() => {
    const updatedLinks = JSON.parse(JSON.stringify(sideBarLinks));
    const rateDropdown = updatedLinks.find((item: any) => item.slug === 'rate');
    if (rateDropdown) {
      if (locationsLoading) {
        rateDropdown.items = [
          {
            title: 'Loading locations...',
            slug: 'rate-loading',
            url: '#',
            type: 'routed',
            icon: PanelRightDashed,
            roles: rateDropdown.roles,
          }
        ];
      } else if (locationsError) {
        rateDropdown.items = [
          {
            title: 'Failed to load locations',
            slug: 'rate-error',
            url: '#',
            type: 'routed',
            icon: PanelRightDashed,
            roles: rateDropdown.roles,
          }
        ];
      } else if (locationData && locationData.success && Array.isArray(locationData.data) && locationData.data.length > 0) {
        rateDropdown.items = locationData.data.map((loc: any) => ({
          title: loc.title || loc.city,
          slug: `rate-${loc.id}`,
          url: `/rate/${loc.id}`,
          type: 'routed',
          icon: PanelRightDashed,
          roles: rateDropdown.roles,
          badge: loc.isAirportZone ? 'Airport' : undefined,
        }));
      } else {
        rateDropdown.items = [
          {
            title: 'No locations found',
            slug: 'rate-empty',
            url: '#',
            type: 'routed',
            icon: PanelRightDashed,
            roles: rateDropdown.roles,
          }
        ];
      }
    }
    return updatedLinks;
  }, [locationData, locationsLoading, locationsError]);

  // Filtered menu for sidebar
  const filteredMenu = useFilteredMenu(links);
  const [selectedPath, setSelectedPath] = React.useState<number[]>([]);
  const [isHovered, setIsHovered] = React.useState(false);

  // Keyboard navigation
  useHotkeys('arrowup', () => handleKeyNavigation(-1), { preventDefault: true });
  useHotkeys('arrowdown', () => handleKeyNavigation(1), { preventDefault: true });

  let currentMenu = filteredMenu;
  for (const index of selectedPath) {
    if (currentMenu[index] && currentMenu[index].type === 'dropdown') {
      currentMenu = currentMenu[index].items || [];
    } else {
      break;
    }
  }

  function handleKeyNavigation(direction: number) {
    const menuItems = document.querySelectorAll('.sidebar-menu-button');
    if (menuItems.length === 0) return;

    const currentIndex = Array.from(menuItems).findIndex(item =>
      item === document.activeElement
    );

    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) {
      nextIndex = menuItems.length - 1;
    } else if (nextIndex >= menuItems.length) {
      nextIndex = 0;
    }

    const nextItem = menuItems[nextIndex] as HTMLElement;
    nextItem?.focus();
  }

  // ----------- USER/ROLE LOGIC (Redux + API) -------------
  let sidebarName = '';
  let sidebarRoleRaw = '';

  if (userLoading) {
    sidebarName = 'Loading...';
    sidebarRoleRaw = '';
  } else if (userError) {
    sidebarName = 'Error';
    sidebarRoleRaw = '';
  } else if (user) {
    sidebarName = user.name;
    sidebarRoleRaw =
      user.role === 'operator' && otherInfo?.operatorRole
        ? otherInfo.operatorRole
        : user.role;
  } else {
    sidebarName = authUser?.name || '';
    sidebarRoleRaw = authUser?.role || '';
  }

  // Format role: camelCase -> "Camel Case"
  const sidebarRole = sidebarRoleRaw
    ? sidebarRoleRaw
        .split(/(?=[A-Z])/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  // -------------------------------------------------------

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar
        collapsible="offcanvas"
        {...props}
        className={cn(
          'transition-all duration-300 ease-in-out',
          isHovered ? 'shadow-lg' : 'shadow-none'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg p-2 transition-colors">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-yellow-500 text-sidebar-primary-foreground">
                <Command className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {sidebarRole ? `${sidebarRole} Portal` : ''}
                </span>
                <span className="truncate text-xs text-muted-foreground">{sidebarName}</span>
              </div>
              <Sparkles className="size-4 text-yellow-400" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className='overflow-y-hidden py-2 px-1'>
          <ScrollArea className="h-[calc(100vh-120px)]">
            <SidebarMenu className="gap-1">
              <SidebarBackButton
                selectedPath={selectedPath}
                setSelectedPath={setSelectedPath}
              />
              <SidebarMenuItems
                currentMenu={currentMenu}
                selectedPath={selectedPath}
                setSelectedPath={setSelectedPath}
                onRateDropdownOpen={refetchLocations}
              />
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

export default AppSidebar;
