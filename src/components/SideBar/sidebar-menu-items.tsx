// src/components/SideBar/sidebar-menu-items.tsx
'use client';

import { getSidebarIcon } from '@/utils/sidebarIcons';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, MapPin, Plane } from 'lucide-react';
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
  const pathname = usePathname();

  const isPathActive = (url: string | undefined) => {
    if (!url || !pathname) return false;
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(url + '/');
  };

  return (
    <>
      {currentMenu.map((item, index) => {
        if (item.type === 'separation') {
          return (
            <SidebarSeparationItem key={`${item.title}-${index}`} item={item} />
          );
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
                  (subItem) =>
                    subItem.type === 'routed' && isPathActive(subItem.url),
                )
              }
              onDropdownOpen={
                item.slug === 'rate' ? onRateDropdownOpen : undefined
              }
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
  // Check if item has isAirport flag (for Rate locations)
  const Icon =
    item.isAirport !== undefined
      ? item.isAirport
        ? Plane
        : MapPin
      : getSidebarIcon(item.title);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuButton
        tooltip={item.title}
        className={cn(
          'text-sm relative rounded-xl transition-colors py-6 px-3 overflow-hidden',
          isActive
            ? 'bg-[#FFF7ED] dark:bg-orange-900/20 text-[#F97316] font-medium'
            : 'text-[#4B5563] dark:text-gray-400',
        )}
      >
        {/* Animated vertical strip */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r origin-left"
            style={{
              transform: 'translateX(-4px)',
              opacity: 0,
              transition:
                'transform 200ms ease-in-out, opacity 200ms ease-in-out',
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
              transition:
                'transform 200ms ease-in-out, opacity 200ms ease-in-out',
            }}
            aria-hidden="true"
          />
        )}

        <Link href={item.url || '#'} className="flex w-full">
          <div
            className={cn(
              'flex items-center gap-3 transition-transform duration-200 ease-in-out',
              isActive ? 'translate-x-1' : '',
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center transition',
                isActive
                  ? 'text-[#F97316]'
                  : 'bg-[#F1F1F1] dark:bg-gray-800 border dark:border-gray-700',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  isActive
                    ? 'text-[#F97316]'
                    : 'text-gray-600 dark:text-gray-400',
                )}
              />
            </div>

            <span
              className={cn(
                'text-sm',
                isActive
                  ? 'text-[#F97316] font-normal'
                  : 'text-[#4B5563] dark:text-gray-400',
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
  const pathname = usePathname();
  const isOpen = selectedPath.includes(index);
  const Icon = getSidebarIcon(item.title);

  const useInlineExpansion = item.slug === 'settings';

  const isSubItemActive = (url: string | undefined) => {
    if (!url || !pathname) return false;
    return pathname === url || pathname.startsWith(url + '/');
  };

  function handleDropdownClick() {
    if (onDropdownOpen) onDropdownOpen();
    setSelectedPath(
      isOpen
        ? selectedPath.filter((i) => i !== index)
        : [...selectedPath, index],
    );
  }

  return (
    <>
      <SidebarMenuSubItem>
        <SidebarMenuButton
          tooltip={item.title}
          onClick={handleDropdownClick}
          className={cn(
            'text-sm relative rounded-xl transition-colors py-2.5 px-3 overflow-hidden',
            isActive
              ? 'bg-[#FFF7ED] dark:bg-orange-900/20 text-[#F97316] font-medium'
              : 'text-[#4B5563] dark:text-gray-400',
          )}
        >
          {/* Animated vertical strip */}
          {isActive && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r origin-left"
              style={{
                transform: 'translateX(-4px)',
                opacity: 0,
                transition:
                  'transform 200ms ease-in-out, opacity 200ms ease-in-out',
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
                transition:
                  'transform 200ms ease-in-out, opacity 200ms ease-in-out',
              }}
              aria-hidden="true"
            />
          )}

          <div className="flex w-full">
            <div
              className={cn(
                'flex items-center gap-3 transition-transform duration-200 ease-in-out w-full',
                isActive ? 'translate-x-1' : '',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive
                    ? 'text-[#F97316]'
                    : 'text-gray-400 dark:text-gray-500',
                )}
              />
              <span
                className={cn(
                  'text-sm',
                  isActive
                    ? 'text-[#F97316] font-medium'
                    : 'text-[#4B5563] dark:text-gray-400',
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
                <ChevronDown className="ml-auto w-4 h-4 transition-transform text-gray-400 dark:text-gray-500" />
              ) : (
                <ChevronRight className="ml-auto w-4 h-4 transition-transform text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuSubItem>

      {useInlineExpansion && isOpen && item.items && (
        <div className="pl-1 border-l-2 border-border/40 space-y-1 mt-1">
          {item.items.map((subItem, subIndex) => {
            const SubIcon = getSidebarIcon(subItem.title);
            const subIsActive = isSubItemActive(subItem.url);

            return (
              <SidebarMenuSubItem key={`${subItem.title}-${subIndex}`}>
                <SidebarMenuButton
                  tooltip={subItem.title}
                  className={cn(
                    'text-sm relative rounded-xl transition-colors py-2 px-3 overflow-hidden',
                    subIsActive
                      ? 'bg-[#FFF7ED] dark:bg-orange-900/20 text-[#F97316] font-medium'
                      : 'text-[#4B5563] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                  )}
                >
                  <Link href={subItem.url || '#'} className="flex w-full">
                    <div className="flex items-center gap-3">
                      <SubIcon
                        className={cn(
                          'w-4 h-4 flex-shrink-0',
                          subIsActive
                            ? 'text-[#F97316]'
                            : 'text-gray-400 dark:text-gray-500',
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm',
                          subIsActive
                            ? 'text-[#F97316]'
                            : 'text-[#4B5563] dark:text-gray-400',
                        )}
                      >
                        {subItem.title}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuSubItem>
            );
          })}
        </div>
      )}
    </>
  );
}
