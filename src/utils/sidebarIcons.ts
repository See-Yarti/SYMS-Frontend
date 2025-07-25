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
      return Box;
    case 'addresses':
      return PanelRightDashed;
    case 'companies':
      return UsersRound;
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
    case 'settings':
      return Box;
    default:
      return Command; // fallback icon
  }
}
