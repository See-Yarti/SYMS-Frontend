import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SidebarMenu } from '@/components/ui/sidebar';
import { useAppSelector } from '@/store';
import { User } from '@/types/user';
import { NavUser } from './nav-user';
import {
  DropdownItem,
  SeparationItem,
  sideBarLinks,
  SideBarRoutedItem,
} from '@/types/SideBarLinks';
import { SidebarBackButton } from './sidebar-back-button';
import { Command } from 'lucide-react';
import { SidebarMenuItems } from './sidebar-menu-items';
import { ScrollArea } from '../ui/scroll-area';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { email, name, role } = useAppSelector(
    (state) => state.auth.user,
  ) as User;
  const [selectedPath, setSelectedPath] = React.useState<number[]>([]);

  let currentMenu: (DropdownItem | SideBarRoutedItem | SeparationItem)[] =
    sideBarLinks;
  for (const index of selectedPath) {
    if (currentMenu[index] && currentMenu[index].type === 'dropdown') {
      currentMenu = (currentMenu[index] as DropdownItem).items;
    } else {
      break;
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} className=''>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
              <Command className="size-5" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {role.split('')[0].toLocaleUpperCase() + role.slice(1)} Portal
              </span>
              <span className="truncate text-xs">{name}</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-y-hidden py-2 px-1'>
        <ScrollArea className="h-full">
        {/* <SidebarGroup className="px-2 "> */}
          <SidebarMenu className="gap-2">
            {/* Back Button */}
            <SidebarBackButton
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
            />

            {/* Render Sidebar Menu Items */}
            <SidebarMenuItems
              currentMenu={currentMenu}
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
            />
          </SidebarMenu>
        {/* </SidebarGroup> */}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name, email, avatar: '' }} />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
