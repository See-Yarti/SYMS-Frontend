'use client';

// src/components/SideBar/app-sidebar.tsx

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { SidebarMenu } from '@/components/ui/sidebar';
import { useAppSelector } from '@/store';
import { NavUser } from './nav-user';
import { sideBarLinks } from '@/types/SideBarLinks';
import { SidebarBackButton } from './sidebar-back-button';
import { PanelRightDashed } from 'lucide-react';
import { SidebarMenuItems } from './sidebar-menu-items';
import { ScrollArea } from '../ui/scroll-area';
import { TooltipProvider } from '../ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFilteredMenu } from '@/hooks/useFilteredMenu';
import { useGetActiveLocations } from '@/hooks/useLocationApi';
import { useTheme } from 'next-themes';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Auth info
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';
  const { theme } = useTheme();

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
          },
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
          },
        ];
      } else if (
        locationData &&
        locationData.success &&
        Array.isArray(locationData.data) &&
        locationData.data.length > 0
      ) {
        rateDropdown.items = locationData.data.map((loc: any) => ({
          title: loc.title || loc.city,
          slug: `rate-${loc.id}`,
          url: `/rate/${loc.id}`,
          type: 'routed',
          isAirport: loc.isAirportZone,
          roles: rateDropdown.roles,
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
          },
        ];
      }
    }
    return updatedLinks;
  }, [locationData, locationsLoading, locationsError]);

  // Filtered menu for sidebar
  const filteredMenu = useFilteredMenu(links);
  const [selectedPath, setSelectedPath] = React.useState<number[]>([]);

  // Keyboard navigation
  useHotkeys('arrowup', () => handleKeyNavigation(-1), {
    preventDefault: true,
  });
  useHotkeys('arrowdown', () => handleKeyNavigation(1), {
    preventDefault: true,
  });

  let currentMenu = filteredMenu;
  for (const index of selectedPath) {
    if (
      currentMenu[index] &&
      currentMenu[index].type === 'dropdown' &&
      currentMenu[index].slug !== 'settings'
    ) {
      currentMenu = currentMenu[index].items || [];
    } else {
      break;
    }
  }

  function handleKeyNavigation(direction: number) {
    const menuItems = document.querySelectorAll('.sidebar-menu-button');
    if (menuItems.length === 0) return;

    const currentIndex = Array.from(menuItems).findIndex(
      (item) => item === document.activeElement,
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

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar collapsible="offcanvas" {...props} className=" p-2 border-none">
        <div className="bg-card rounded-2xl border-0 h-full flex flex-col shadow-xl dark:shadow-2xl dark:shadow-black/20 transition-colors duration-300">
          <SidebarHeader className="px-4 py-4">
            <div className="flex items-center justify-center">
              {theme === 'dark' ? (
                <img
                  src="/images/logo1-white.png"
                  alt="Yella Ride Logo"
                  className="w-[130px] h-[20px] my-3"
                />
              ) : (
                <img
                  src="/images/logo1-black.png"
                  alt="Yella Ride Logo"
                  className="w-[130px] h-[20px] my-3"
                />
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-hidden py-2 px-3">
            <ScrollArea className="h-full">
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
          <SidebarFooter className="px-3 pb-3">
            <NavUser />
          </SidebarFooter>
        </div>
      </Sidebar>
    </TooltipProvider>
  );
}

export default AppSidebar;
