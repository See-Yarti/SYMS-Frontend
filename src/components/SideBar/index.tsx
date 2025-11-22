// src/components/SideBar/index.tsx:

import { Link, Outlet } from 'react-router-dom';
import ThemeSelect from '../Select/Theme-Select';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '../ui/button';
import { Maximize, Settings } from 'lucide-react';
import { Label } from '../ui/label';
// import NotificationsSheet from '../Sheet/Notifications';
import { useLocation } from 'react-router-dom';
const SideBar = () => {
  const { pathname } = useLocation();
  let firstIndex = pathname.split('/')[1] || 'dashboard';
  firstIndex = firstIndex.charAt(0).toUpperCase() + firstIndex.slice(1);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-background border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-1 items-center gap-2 px-3">
                  <SidebarTrigger />
              <Label className="line-clamp-1">{firstIndex}</Label>
            </div>
            <div className="flex items-center gap-2.5 px-3 ">
              <Separator orientation="vertical" className="ml-2 h-4" />
              {/* <NotificationsSheet /> */}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 relative inline-flex"
                onClick={toggleFullScreen}
              >
                <Maximize />
                <span className="sr-only">Toggle Full Screen Mode</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 relative inline-flex"
                asChild
              >
                <Link to="/settings">
                  <Settings />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
              <ThemeSelect />
            </div>
          </header>
          <div className="p-3">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};export default SideBar;
