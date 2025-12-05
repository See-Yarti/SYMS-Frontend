// src/components/SideBar/sidebar-menu-items.tsx
import { getSidebarIcon } from '@/utils/sidebarIcons';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SidebarMenuSubItem, SidebarMenuButton } from '@/components/ui/sidebar';
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

function SidebarSeparationItem({ item: _item }: { item: SideBarItem }) {
  // Hide separation labels to match the design
  return null;
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
    <SidebarMenuSubItem>
      <SidebarMenuButton
        tooltip={item.title}
        className={cn(
          'text-sm relative rounded-lg transition-colors py-2.5 px-3',
          isActive 
            ? 'bg-[#FEDE35]/15 text-[#FEDE35] font-bold' 
            : 'text-[#4B5563] hover:bg-gray-50'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FEDE35] rounded-r" />
        )}
        <Link to={item.url || '#'} className="flex w-full items-center gap-3">
          <Icon
            className={cn(
              'w-5 h-5 flex-shrink-0',
              isActive ? 'text-[#FEDE35]' : 'text-gray-400'
            )}
          />
          <span className={cn(
            'text-sm',
            isActive ? 'text-[#FEDE35] font-bold' : 'text-[#4B5563]'
          )}>
            {item.title}
          </span>
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
    <SidebarMenuSubItem>
      <SidebarMenuButton
        tooltip={item.title}
        onClick={handleDropdownClick}
        className={cn(
          'text-sm relative rounded-lg transition-colors py-2.5 px-3',
          isActive 
            ? 'bg-[#FEDE35]/15 text-[#FEDE35] font-bold' 
            : 'text-[#4B5563] hover:bg-gray-50'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FEDE35] rounded-r" />
        )}
        <div className="flex w-full items-center gap-3">
          <Icon className={cn(
            'w-5 h-5 flex-shrink-0',
            isActive ? 'text-[#FEDE35]' : 'text-gray-400'
          )} />
          <span className={cn(
            'text-sm',
            isActive ? 'text-[#FEDE35] font-bold' : 'text-[#4B5563]'
          )}>
            {item.title}
          </span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
          {isOpen ? (
            <ChevronDown className="ml-auto w-4 h-4 transition-transform text-gray-400" />
          ) : (
            <ChevronRight className="ml-auto w-4 h-4 transition-transform text-gray-400" />
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}
