import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { SidebarLeft } from './sidebar-left';
import Header from '../Header';

export default function SideBarLayout() {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 bg-background">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
