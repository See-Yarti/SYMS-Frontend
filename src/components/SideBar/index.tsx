import { Outlet } from 'react-router-dom';
import ThemeSelect from '../Select/Theme-Select';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '../ui/button';
import { Inbox, Maximize, Settings } from 'lucide-react';
import { Label } from '../ui/label';
import NotificationsSheet from '../Sheet/Notifications';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationPanel } from '../Panels/notification-panel';
const SideBar = () => {
  const { pathname } = useLocation();
  let firstIndex = pathname.split('/')[1] || 'dashboard';
  firstIndex = firstIndex.charAt(0).toUpperCase() + firstIndex.slice(1);
  const isMobile = useIsMobile();
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="p-5">
          <header className="sticky top-0 flex shrink-0 items-center z-40 bg-background">
            <div className="flex flex-1 justify-between items-center">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <>
                    <SidebarTrigger />
                  </>
                )}
                <Label className="line-clamp-1">{firstIndex}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Separator orientation="vertical" className="ml-2 h-4" />
                {/* <NotificationsSheet /> */}
                {/* <Button
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
                </Button> */}
                <ThemeSelect />
              </div>
            </div>
          </header>
          <div className="py-5">
            <Outlet />
          </div>
        </SidebarInset>
        <NotificationPanel />
      </SidebarProvider>
    </div>
  );
};

export default SideBar;
