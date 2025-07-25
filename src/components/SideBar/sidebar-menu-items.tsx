// src/components/SideBar/sidebar-menu-items.tsx
import { getSidebarIcon } from '@/utils/sidebarIcons';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SidebarMenuSubItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { SideBarItem } from '@/types/SideBarLinks';

interface SidebarMenuItemsProps {
  currentMenu: SideBarItem[];
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
  onRateDropdownOpen?: () => void;
}

export function SidebarMenuItems({
  currentMenu,
  selectedPath,
  setSelectedPath,
  onRateDropdownOpen,
}: SidebarMenuItemsProps) {
  const location = useLocation();

  return (
    <>
      {currentMenu.map((item, index) => {
        if (item.type === 'separation') {
          return <SidebarSeparationItem key={`${item.title}-${index}`} item={item} />;
        }

        if (item.type === 'routed') {
          return (
            <SidebarRoutedItem
              key={`${item.title}-${index}`}
              item={item}
              isActive={location.pathname === item.url}
            />
          );
        }

        if (item.type === 'dropdown') {
          return (
            <SidebarDropdownItem
              key={`${item.title}-${index}`}
              item={item}
              index={index}
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
              isActive={
                !!item.items?.some(
                  subItem =>
                    subItem.type === 'routed' &&
                    location.pathname === subItem.url
                )
              }
              // Only Rate gets refetch!
              onDropdownOpen={item.slug === 'rate' ? onRateDropdownOpen : undefined}
            />
          );
        }

        return null;
      })}
    </>
  );
}

function SidebarSeparationItem({ item }: { item: SideBarItem }) {
  return (
    <React.Fragment>
      {item.isHorizontal && item.position === 'top' && (
        <div className="flex justify-center items-center">
          <Separator className="mr-2 h-[1.5px] w-1/2" />
        </div>
      )}
      <Label className="text-xs text-muted-foreground dark:text-gray-50 font-medium px-2 py-1">
        {item.title}
      </Label>
      {item.isHorizontal && item.position === 'bottom' && (
        <div className="flex justify-center items-center">
          <Separator className="mr-2 h-[1.5px] w-1/2" />
        </div>
      )}
    </React.Fragment>
  );
}



function SidebarRoutedItem({
  item,
  isActive,
}: {
  item: SideBarItem;
  isActive?: boolean;
}) {
  const Icon = getSidebarIcon(item.title);

  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton
        tooltip={item.title}
        className={cn(
          'text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
        )}
      >
        <Link to={item.url || '#'} className="flex w-full items-center gap-2">
          <Icon
            className={cn(
              'w-4 h-4',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <span>{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}


function SidebarDropdownItem({
  item,
  index,
  selectedPath,
  setSelectedPath,
  isActive,
  onDropdownOpen,
}: {
  item: SideBarItem;
  index: number;
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
  isActive?: boolean;
  onDropdownOpen?: () => void;
}) {
  const isOpen = selectedPath.includes(index);
  const Icon = getSidebarIcon(item.title);

  function handleDropdownClick() {
    if (onDropdownOpen) onDropdownOpen();
    setSelectedPath(
      isOpen
        ? selectedPath.filter(i => i !== index)
        : [...selectedPath, index]
    );
  }

  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton
        tooltip={item.title}
        onClick={handleDropdownClick}
        className={cn(
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'text-sidebar-accent-foreground font-medium'
        )}
      >
        <Icon className={cn(
          'w-4 h-4',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )} />
        <span>{item.title}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto">
            {item.badge}
          </Badge>
        )}
        {isOpen ? (
          <ChevronDown className="ml-auto w-4 h-4 transition-transform" />
        ) : (
          <ChevronRight className="ml-auto w-4 h-4 transition-transform" />
        )}
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}
