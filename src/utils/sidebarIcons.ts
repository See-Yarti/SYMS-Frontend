// Keep all Lucide imports
import {
  PanelLeftDashed,
  PanelRightDashed,
  UsersRound,
  Package,
  NotebookTabs,
  Layers2,
  Layers3,
  Box,
  Command,
  Calculator,
  Car,
  Building2,
  Settings,
  Calendar,
  FileText,
} from 'lucide-react';

// Import ONLY your custom SVG wrapper components
import DashboardIcon from '../components/SideBar/icons/DashboardIcon';
import SettingsIcon from '../components/SideBar/icons/SettingsIcon';
import CarClassIcon from '../components/SideBar/icons/CarClassIcon';
import CompaniesIcon from '../components/SideBar/icons/CompaniesIcon';
import BookingsIcon from '../components/SideBar/icons/BookingsIcon';
import AccountingIcon from '../components/SideBar/icons/AccountingIcon';

export function getSidebarIcon(name: string) {
  const normalized = name.toLowerCase().replace(/\s/g, '');
  switch (normalized) {
    case 'dashboard':
      return DashboardIcon;
    case 'settings':
      return SettingsIcon;
    case 'carclasses':
    case 'carclass':
      return CarClassIcon;
    case 'companies':
      return CompaniesIcon;
    case 'bookings':
    case 'operatorbookings':
      return BookingsIcon;
    case 'accounting':
    case 'adminaccounting':
    case 'operatoraccounting':
      return AccountingIcon;

    // Everything else stays on Lucide icons
    case 'rate':
      return PanelRightDashed;
    case 'addresses':
      return PanelRightDashed;
    case 'operators':
      return UsersRound;
    case 'products':
      return Package;
    case 'orders':
      return NotebookTabs;
    case 'allorders':
      return Layers2;
    case 'pendingorders':
    case 'completedorders':
      return Layers3;
    case 'returns&refunds':
      return Layers2;
    case 'usermanagement':
      return UsersRound;
    default:
      return Command; // fallback
  }
}