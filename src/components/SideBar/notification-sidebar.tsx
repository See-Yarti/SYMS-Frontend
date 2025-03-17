import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import NotificationsList from './notifications-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '../ui/label';

export function NotificationSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky hidden lg:flex top-0 h-svh border-l"
      {...props}
    >
      <SidebarHeader>
        <Label className="text-xs font-medium font-abel text-secondary-foreground tracking-tight text-center opacity-25">
          Notification Panel
        </Label>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NotificationsList />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
