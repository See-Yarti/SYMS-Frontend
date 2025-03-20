import { Outlet } from 'react-router-dom';
import ThemeSelect from '../Select/Theme-Select';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '../ui/button';
import { Maximize, Settings } from 'lucide-react';
import { Label } from '../ui/label';
import NotificationsSheet from '../Sheet/Notifications';
import { useLocation } from 'react-router-dom';
const SideBar = () => {
  const { pathname } = useLocation();
  let firstIndex = pathname.split('/')[1] || 'dashboard';
  firstIndex = firstIndex.charAt(0).toUpperCase() + firstIndex.slice(1);
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex">
          <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
            <div className="flex flex-1 items-center gap-2 px-3">
                  <SidebarTrigger />
              <Label className="line-clamp-1">{firstIndex}</Label>
            </div>
            <div className="flex items-center gap-2.5 px-3 ">
              <Separator orientation="vertical" className="ml-2 h-4" />
              <NotificationsSheet />
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 relative inline-flex"
              >
                <Maximize />
                <span className="sr-only">Full Screen Mode</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 relative inline-flex"
              >
                <Settings />
                <span className="sr-only">Settings</span>
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
};

export default SideBar;
