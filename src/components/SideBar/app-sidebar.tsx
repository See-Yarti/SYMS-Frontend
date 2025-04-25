// src/components/SideBar/app-sidebar.tsx:
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
import { User } from '@/types/user';
import { NavUser } from './nav-user';
import {
  DropdownItem,
  SeparationItem,
  sideBarLinks,
  SideBarRoutedItem,
} from '@/types/SideBarLinks';
import { SidebarBackButton } from './sidebar-back-button';
import { Command, Sparkles } from 'lucide-react';
import { SidebarMenuItems } from './sidebar-menu-items';
import { ScrollArea } from '../ui/scroll-area';
import { TooltipProvider } from '../ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { email, name, role } = useAppSelector(
    (state) => state.auth.user,
  ) as User;
  const [selectedPath, setSelectedPath] = React.useState<number[]>([]);
  const [isHovered, setIsHovered] = React.useState(false);

  // Keyboard navigation for sidebar
  useHotkeys('arrowup', () => handleKeyNavigation(-1), { preventDefault: true });
  useHotkeys('arrowdown', () => handleKeyNavigation(1), { preventDefault: true });

  let currentMenu = sideBarLinks as (DropdownItem | SideBarRoutedItem | SeparationItem)[];
  for (const index of selectedPath) {
    if (currentMenu[index] && currentMenu[index].type === 'dropdown') {
      currentMenu = (currentMenu[index] as DropdownItem).items;
    } else {
      break;
    }
  }

// Update in app-sidebar.tsx
const handleKeyNavigation = (direction: number) => {
  const menuItems = document.querySelectorAll('.sidebar-menu-button');
  if (menuItems.length === 0) return;

  const currentIndex = Array.from(menuItems).findIndex(item =>
    item === document.activeElement
  );

  let nextIndex = currentIndex + direction;
  
  // Wrap around if at boundaries
  if (nextIndex < 0) {
    nextIndex = menuItems.length - 1;
  } else if (nextIndex >= menuItems.length) {
    nextIndex = 0;
  }

  const nextItem = menuItems[nextIndex] as HTMLElement;
  nextItem?.focus();
};

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
                  {role.split('')[0].toLocaleUpperCase() + role.slice(1)} Portal
                </span>
                <span className="truncate text-xs text-muted-foreground">{name}</span>
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
                currentMenu={currentMenu as any}
                selectedPath={selectedPath}
                setSelectedPath={setSelectedPath}
              />
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <NavUser user={{ name, email, avatar: '' }} />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}