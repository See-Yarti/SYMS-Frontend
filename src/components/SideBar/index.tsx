// src/components/SideBar/index.tsx:
'use client';

import { useState } from 'react';
import { SidebarInset, SidebarProvider, useSidebar } from '../ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { Button } from '../ui/button';
import { Bell, Maximize2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import ThemeSelect from '../Select/Theme-Select';

// Sample notifications data
const notifications = [
  {
    id: 1,
    title: 'Booking Confirmed',
    message: 'Your vehicle is ready for pickup',
    time: 'Just now',
    date: 'Today',
  },
  {
    id: 2,
    title: 'Payment Reminder',
    message: 'Rental payment due tomorrow',
    time: 'Yesterday',
    date: 'Today',
  },
  {
    id: 3,
    title: 'New Arrival',
    message: 'Luxury SUV fleet now available!',
    time: '20 Sep',
    date: 'Earlier',
  },
];

// Custom Menu Toggle Icon
const MenuIcon = () => (
  <svg
    width="18"
    height="14"
    viewBox="0 0 18 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-foreground"
  >
    {/* Left-pointing arrow */}
    <path
      d="M17 7L1 7M1 7L5 3M1 7L5 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Three horizontal lines to the right of the arrow */}
    <path
      d="M8 1H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 7H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 13H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Header component that uses sidebar context
const Header = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-background/911 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Left side - Menu toggle */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-[#6B7280] border border-border bg-card hover:bg-accent"
          onClick={toggleSidebar}
        >
          <MenuIcon />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        {/* Fullscreen button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-lg border text-[#6B7280] border-border bg-card hover:bg-accent"
          onClick={toggleFullScreen}
        >
          <Maximize2 className="h-4 w-4" />
          <span className="sr-only">Toggle Full Screen Mode</span>
        </Button>

        {/* Notification bell with popover */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-lg text-[#6B7280] border border-border bg-card hover:bg-accent relative"
            >
              <Bell className="h-4 w-4" />
              {/* Notification dot */}
              {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" /> */}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 border-0 shadow-xl rounded-2xl overflow-hidden"
            align="end"
            sideOffset={8}
          >
            <div className="bg-[#F97316] text-white p-5">
              <h3 className="text-xl font-semibold mb-4">Notifications</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-white/90 mb-3">
                    Today
                  </p>

                  {notifications.slice(0, 2).map((notification, index) => (
                    <div key={notification.id} className="mb-3">
                      <p className="font-semibold text-sm">
                        {notification.title}:{' '}
                        <span className="font-normal">
                          {notification.message}
                        </span>
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        {notification.time}
                      </p>
                      {index < 1 && (
                        <div className="border-t border-white/20 mt-3" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/20 pt-3">
                  {notifications.slice(2).map((notification) => (
                    <div key={notification.id}>
                      <p className="font-semibold text-sm">
                        {notification.title}:{' '}
                        <span className="font-normal">
                          {notification.message}
                        </span>
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme switcher button */}
        <div className="[&>button]:h-11 [&>button]:w-11 [&>button]:rounded-lg [&>button]:border [&>button]:border-border [&>button]:bg-card">
          <ThemeSelect />
        </div>
      </div>
    </header>
  );
};

const SideBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background min-h-screen transition-colors duration-300">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-background transition-colors duration-300">
          <Header />
          <div className="p-3">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default SideBar;
