import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import { Inbox } from 'lucide-react';
import { Label } from '../ui/label';
import ThemeButton from '../Button/ThemeButton';
import NotificationsSheet from '../Sheet/Notifications';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const { pathname } = useLocation();
  let firstIndex = pathname.split('/')[1] || 'dashboard';
  firstIndex = firstIndex.charAt(0).toUpperCase() + firstIndex.slice(1);
  return (
    <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background z-40">
      <div className="flex flex-1 justify-between items-center gap-2 px-3">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Label className="line-clamp-1">{firstIndex}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="ml-2 h-4" />
          <NotificationsSheet />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 relative inline-flex"
          >
            <Inbox />
            <span className="sr-only">Inbox</span>
          </Button>
          <ThemeButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
