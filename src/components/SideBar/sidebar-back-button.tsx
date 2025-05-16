// src/components/SideBar/sidebar-back-button.tsx
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

interface SidebarBackButtonProps {
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}

export function SidebarBackButton({
  selectedPath,
  setSelectedPath,
}: SidebarBackButtonProps) {
  if (selectedPath.length === 0) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="font-medium"
        onClick={() => setSelectedPath(selectedPath.slice(0, -1))}
      >
        <ChevronLeft className="transition-transform duration-200" />
        Back
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}