import * as React from 'react';
import { AudioWaveform, Home, Inbox, Search, Sparkles } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import CommandBox from './command-box';
import ProfileDropdown from './profile-dropdown';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Home',
      slug: 'home',
      url: '/',
      icon: Home,
      isActive: true,
    },
    {
      title: 'Inbox',
      slug: 'inbox',
      url: '/inbox',
      icon: Inbox,
      badge: '10',
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className=" border-r-0" variant="sidebar" side="left" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem></SidebarMenuItem>
        </SidebarMenu>
        <ProfileDropdown />
        <CommandBox />
        <NavMain />
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
