import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarMenuSubItem, SidebarMenuButton } from '@/components/ui/sidebar';
import {
  DropdownItem,
  SeparationItem,
  SideBarRoutedItem,
} from '@/types/SideBarLinks';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { motion } from 'framer-motion';
interface SidebarMenuItemsProps {
  currentMenu: (DropdownItem | SideBarRoutedItem | SeparationItem)[];
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}

export function SidebarMenuItems({
  currentMenu,
  selectedPath,
  setSelectedPath,
}: SidebarMenuItemsProps) {
  return (
    <>
      {currentMenu.map((item, index) => {
        if (item.type === 'separation') {
          return <SidebarSeparationItem key={item.title} item={item} />;
        }

        if (item.type === 'routed') {
          return <SidebarRoutedItem key={item.title} item={item} />;
        }

        return (
          <SidebarDropdownItem
            key={item.title}
            item={item}
            index={index}
            selectedPath={selectedPath}
            setSelectedPath={setSelectedPath}
          />
        );
      })}
    </>
  );
}

function SidebarSeparationItem({ item }: { item: SeparationItem }) {
  return (
    <React.Fragment>
      {item.isHorizontal && item.position == 'top' && (
        <Separator className="mr-2 h-[2px]" />
      )}
      <Label className="text-xs text-muted-foreground dark:text-gray-50 font-medium font-abel">
        {item.title}
      </Label>
      {item.isHorizontal && item.position == 'bottom' && (
        <Separator className="mr-2 h-[2px]" />
      )}
    </React.Fragment>
  );
}

function SidebarRoutedItem({
  item,
}: {
  item: DropdownItem | SideBarRoutedItem;
}) {
  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton tooltip={item.title} className="text-sm">
        {item.type === 'routed' ? (
          <Link to={item.url} className="flex w-full items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.title}</span>
          </Link>
        ) : (
          <>
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.title}</span>
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}

function SidebarDropdownItem({
  item,
  index,
  selectedPath,
  setSelectedPath,
}: {
  item: DropdownItem;
  index: number;
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const isOpen = selectedPath.includes(index);

  return (
    <SidebarMenuSubItem className="px-1">
      {/* Toggle Button */}
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() =>
          setSelectedPath(
            isOpen
              ? selectedPath.filter((i) => i !== index)
              : [...selectedPath, index],
          )
        }
      >
        {item.icon && <item.icon className="w-4 h-4" />}
        <span>{item.title}</span>
        <ChevronRight className="ml-auto w-4 h-4" />
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}
