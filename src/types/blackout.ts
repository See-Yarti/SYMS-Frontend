// types/blackout.ts

export interface Blackout {
  id: number;
  description: string;
  locations: string[];
  group: string;
  carClasses: string[];
  blackoutType: string;
  startDate: string;
  endDate: string;
  created: string;
  modified: string;
}

export interface BlackoutDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Blackout) => void;
  blackout: Blackout | null;
  locations: string[];
  carClasses: string[];
  blackoutTypes: string[];
}
