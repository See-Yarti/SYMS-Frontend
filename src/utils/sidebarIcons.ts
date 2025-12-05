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

export function getSidebarIcon(name: string) {
  const normalized = name.toLowerCase().replace(/\s/g, '');
  switch (normalized) {
    case 'dashboard':
      return PanelLeftDashed;
    case 'rate':
      return PanelRightDashed;
    case 'carclasses':
    case 'carclass':
      return Car;
    case 'addresses':
      return PanelRightDashed;
    case 'companies':
      return Building2;
    case 'operators':
      return UsersRound;
    case 'bookings':
    case 'operatorbookings':
      return Calendar;
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
    case 'settings':
      return Settings;
    case 'accounting':
    case 'adminaccounting':
    case 'operatoraccounting':
      return FileText;
    default:
      return Command; // fallback icon
  }
}
