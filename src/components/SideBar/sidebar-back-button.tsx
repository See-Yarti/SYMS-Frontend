// src/components/SideBar/sidebar-back-button.tsx:

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { sideBarLinks, DropdownItem } from '@/types/SideBarLinks';

interface SidebarBackButtonProps {
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}

export function SidebarBackButton({
  selectedPath,
  setSelectedPath,
}: SidebarBackButtonProps) {
  if (selectedPath.length === 0) return null;

  // Find the title of the last selected dropdown item
  let menu = sideBarLinks;
  for (let i = 0; i < selectedPath.length - 1; i++) {
    menu = (menu[selectedPath[i]] as DropdownItem)?.items || [];
  }
  const backLabel =
    menu[selectedPath[selectedPath.length - 1]]?.title || 'Back';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="font-medium"
        onClick={() => setSelectedPath(selectedPath.slice(0, -1))}
      >
        <ChevronLeft className="transition-transform duration-200" />
        {backLabel}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
