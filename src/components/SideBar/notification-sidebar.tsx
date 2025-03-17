import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Label } from '../ui/label';
import NotificationsList from '../Panels/notifications-list';

export function NotificationSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky hidden lg:flex top-0 h-svh border-l"
      {...props}
    >
      <SidebarHeader className="">
        <Label className="text-sm font-medium">Notifications</Label>
      </SidebarHeader>
      <SidebarContent>
        <NotificationsList />
      </SidebarContent>
    </Sidebar>
  );
}
