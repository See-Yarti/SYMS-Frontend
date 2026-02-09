import { useAppSelector } from '@/store';
import { SideBarItem } from '@/types/SideBarLinks';

export const useFilteredMenu = (menuItems: SideBarItem[]) => {
  const { user, otherInfo } = useAppSelector((state) => state.auth);

  // Helper function to check access for the current user and sidebar item
  const hasAccess = (item: SideBarItem) => {
    if (!item.roles) return true; // No restriction, show to everyone

    if (user?.role === 'admin') {
      return item.roles.includes('admin');
    }

    if (user?.role === 'operator') {
      // If you want "operator" items to show for all operators, include 'operator'
      // If you want ONLY operatorRole-specific, remove 'operator' from roles arrays you don't want
      const opRole = otherInfo?.operatorRole;
      return opRole ? item.roles.includes(opRole) : false;
    }

    // No access by default
    return false;
  };

  // Recursively filter menu items
  const filterByRole = (items: SideBarItem[]): SideBarItem[] =>
    items
      .filter((item) => {
        if (item.type === 'separation') return true;
        if (item.type === 'dropdown' && item.items) {
          const filteredItems = filterByRole(item.items);
          return hasAccess(item) && filteredItems.length > 0;
        }
        return hasAccess(item);
      })
      .filter((item, index, array) => {
        // Remove consecutive separations or separation at start/end
        if (item.type === 'separation') {
          if (index === 0 || index === array.length - 1) return false;
          const nextItem = array[index + 1];
          return nextItem?.type !== 'separation';
        }
        return true;
      });

  return filterByRole(menuItems);
};
