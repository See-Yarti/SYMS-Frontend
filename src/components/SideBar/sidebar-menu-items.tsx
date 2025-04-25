// src/components/SideBar/sidebar-menu-items.tsx:
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SidebarMenuSubItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type SideBarItem = {
  type: 'separation' | 'routed' | 'dropdown' | 'dynamic-product-type';
  title: string;
  url?: string;
  slug?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isHorizontal?: boolean;
  position?: 'bottom' | 'top';
  items?: SideBarItem[];
  badge?: string | number;
};

interface SidebarMenuItemsProps {
  currentMenu: SideBarItem[];
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}

export function SidebarMenuItems({
  currentMenu,
  selectedPath,
  setSelectedPath,
}: SidebarMenuItemsProps) {
  const location = useLocation();

  return (
    <>
      {currentMenu.map((item, index) => {
        if (item.type === 'separation') {
          return <SidebarSeparationItem key={item.title} item={item} />;
        }

        if (item.type === 'routed') {
          return <SidebarRoutedItem 
            key={item.title} 
            item={item} 
            isActive={location.pathname === item.url} 
          />;
        }

        return (
          <SidebarDropdownItem
            key={item.title}
            item={item}
            index={index}
            selectedPath={selectedPath}
            setSelectedPath={setSelectedPath}
            isActive={item.items?.some(subItem => 
              subItem.type === 'routed' && location.pathname === subItem.url
            )}
          />
        );
      })}
    </>
  );
}

function SidebarSeparationItem({ item }: { item: SideBarItem }) {
  return (
    <React.Fragment>
      {item.isHorizontal && item.position == 'top' && (
        <div className="flex justify-center items-center">
          <Separator className="mr-2 h-[1.5px] w-1/2" />
        </div>
      )}
      <Label className="text-xs text-muted-foreground dark:text-gray-50 font-medium px-2 py-1">
        {item.title}
      </Label>
      {item.isHorizontal && item.position == 'bottom' && (
        <div className="flex justify-center items-center">
          <Separator className="mr-2 h-[1.5px] w-1/2" />
        </div>
      )}
    </React.Fragment>
  );
}

function SidebarRoutedItem({ item, isActive }: { item: SideBarItem, isActive?: boolean }) {
  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton 
        tooltip={item.title} 
        className={cn(
          "text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <Link to={item.url || '#'} className="flex w-full items-center gap-2">
          {item.icon && <item.icon className={cn(
            "w-4 h-4",
            isActive ? "text-primary" : "text-muted-foreground"
          )} />}
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
  isActive
}: {
  item: SideBarItem;
  index: number;
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
  isActive?: boolean;
}) {
  const isOpen = selectedPath.includes(index);

  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() =>
          setSelectedPath(
            isOpen
              ? selectedPath.filter((i) => i !== index)
              : [...selectedPath, index],
          )
        }
        className={cn(
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "text-sidebar-accent-foreground font-medium"
        )}
      >
        {item.icon && <item.icon className={cn(
          "w-4 h-4",
          isActive ? "text-primary" : "text-muted-foreground"
        )} />}
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