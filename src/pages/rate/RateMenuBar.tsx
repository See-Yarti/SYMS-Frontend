// src/pages/rate/RateMenuBar.tsx
import { useParams, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarDays, LineChart, Ban, Car, Percent } from 'lucide-react';

const RATE_TABS = [
  { label: 'Car Classes', path: 'car-classes', icon: <Car className="w-4 h-4 mr-1" /> },
  { label: 'Rates', path: '', icon: <CalendarDays className="w-4 h-4 mr-1" /> },
  { label: 'Taxes', path: 'taxes', icon: <Percent className="w-4 h-4 mr-1" /> },
  { label: 'CDW', path: 'cdw', icon: <LineChart className="w-4 h-4 mr-1" /> },
  { label: 'Blackouts', path: 'blackouts', icon: <Ban className="w-4 h-4 mr-1" /> },
];

export default function RateMenuBar() {
  const { locationId } = useParams();
  const { pathname } = useLocation();

  return (
    <div
      className={cn(
        'sticky top-0 z-30 w-full bg-white rounded-xl backdrop-blur-md border-b border-muted shadow',
        'flex items-center gap-2 px-4'
      )}
      style={{ minHeight: 56 }}
    >
      <div className="flex gap-1 w-full overflow-x-auto">
        {RATE_TABS.map((tab) => {
          const path = `/rate/${locationId}${tab.path ? `/${tab.path}` : ''}`;
          const isActive =
            (tab.path === '' && pathname === `/rate/${locationId}`) ||
            (tab.path !== '' && pathname === path);

          return (
            <Button
              key={tab.label}
              asChild
              variant="ghost"
              className={cn(
                'h-12 rounded-none px-4 font-medium flex items-center gap-1 transition-all duration-150 text-muted-foreground',
                'hover:text-foreground hover:bg-muted/60',
                isActive &&
                  'text-[#F56304] font-semibold border-b-2 border-[#F56304] bg-muted/80 shadow-sm'
              )}
              tabIndex={0}
            >
              <Link to={path} className="flex items-center whitespace-nowrap">
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}