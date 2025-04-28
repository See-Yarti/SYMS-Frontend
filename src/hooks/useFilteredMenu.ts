// src/hooks/useFilteredMenu.ts
import { useAppSelector } from '@/store';
import { SideBarItem } from '@/types/SideBarLinks';

export const useFilteredMenu = (menuItems: SideBarItem[]) => {
  const userRole = useAppSelector((state) => state.auth.user?.role);
  
  const filterByRole = (items: SideBarItem[]): SideBarItem[] => {
    return items
      .filter(item => {
        // Keep separation items
        if (item.type === 'separation') return true;
        
        // Check if user has access
        const hasAccess = !item.roles || (userRole && item.roles.includes(userRole as "operator" | "admin"));
        
        // For dropdown items, also filter their children
        if (item.type === 'dropdown' && item.items) {
          const filteredItems = filterByRole(item.items);
          return hasAccess && filteredItems.length > 0;
        }
        
        return hasAccess;
      })
      .filter((item, index, array) => {
        // Remove consecutive separations
        if (item.type === 'separation') {
          const nextItem = array[index + 1];
          return nextItem?.type !== 'separation';
        }
        return true;
      });
  };

  return filterByRole(menuItems);
};