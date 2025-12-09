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

  const isPathActive = (url: string | undefined) => {
    if (!url) return false;
    if (url === '/') return location.pathname === '/';
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

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
              isActive={isPathActive(item.url)}
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
                    isPathActive(subItem.url)
                )
              }
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
          'text-sm relative rounded-xl transition-colors py-6 px-3 overflow-hidden',
          isActive
            ? 'bg-[#FFF7ED] text-[#F97316] font-medium'
            : 'text-[#4B5563] '
        )}
      >
        {/* Animated vertical strip */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r origin-left"
            style={{
              transform: 'translateX(-4px)',
              opacity: 0,
              transition: 'transform 200ms ease-in-out, opacity 200ms ease-in-out',
            }}
            aria-hidden="true"
          />
        )}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r"
            style={{
              transform: 'translateX(0)',
              opacity: 1,
              transition: 'transform 200ms ease-in-out, opacity 200ms ease-in-out',
            }}
            aria-hidden="true"
          />
        )}

        <Link to={item.url || '#'} className="flex w-full">
          <div
            className={cn(
              'flex items-center gap-3 transition-transform duration-200 ease-in-out',
              isActive ? 'translate-x-1' : ''
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition",
                isActive
                  ? "text-[#F97316]"
                  : "bg-[#F1F1F1] border"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-[#F97316]" : "text-gray-600"
                )}
              />
            </div>

            <span
              className={cn(
                'text-sm',
                isActive ? 'text-[#F97316] font-normal' : 'text-[#4B5563]'
              )}
            >
              {item.title}
            </span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </div>
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
      isOpen ? selectedPath.filter(i => i !== index) : [...selectedPath, index]
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuButton
        tooltip={item.title}
        onClick={handleDropdownClick}
        className={cn(
          'text-sm relative rounded-xl transition-colors py-2.5 px-3 overflow-hidden',
          isActive
            ? 'bg-[#FFF7ED] text-[#F97316] font-medium'
            : 'text-[#4B5563]'
        )}
      >
        {/* Animated vertical strip */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r origin-left"
            style={{
              transform: 'translateX(-4px)',
              opacity: 0,
              transition: 'transform 200ms ease-in-out, opacity 200ms ease-in-out',
            }}
            aria-hidden="true"
          />
        )}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r"
            style={{
              transform: 'translateX(0)',
              opacity: 1,
              transition: 'transform 200ms ease-in-out, opacity 200ms ease-in-out',
            }}
            aria-hidden="true"
          />
        )}

        <div className="flex w-full">
          <div
            className={cn(
              'flex items-center gap-3 transition-transform duration-200 ease-in-out w-full',
              isActive ? 'translate-x-1' : ''
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive ? 'text-[#F97316]' : 'text-gray-400'
              )}
            />
            <span
              className={cn(
                'text-sm',
                isActive ? 'text-[#F97316] font-medium' : 'text-[#4B5563]'
              )}
            >
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
        </div>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}