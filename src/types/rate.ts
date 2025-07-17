// types/rate.ts
export interface Rate {
  id: number;
  group: string;
  car: string;
  begin: string;
  end: string;
  blackouts: string;
  daily: number;
  weekend: number;
  weekly: number;
  monthly: number;
  lastMod: string;
}

export interface RateGroup {
  label: string;
  value: string;
}

export interface CarClass {
  label: string;
  value: string;
}

export interface RatePlan {
  type: string;
  unl: boolean;
  base: number;
  hour: number;
  day: number;
  periods: number[];
}

export interface NewRateData {
  rateGroup: string;
  carClass: string;
  startDate: string;
  endDate: string;
  daily: RatePlan;
  weekly: RatePlan;
  monthly: RatePlan;
}

export interface NewRateDialogProps {
  open: boolean;
  onClose: () => void;
  onAddRate: (newRate: NewRateData) => void;
  rateGroups: RateGroup[];
  carClasses: CarClass[];
}