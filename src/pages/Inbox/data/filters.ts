import { CheckCheck, CircleX, Clock, LucideIcon } from "lucide-react";

export type RequestT = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

export const RequestStatus: RequestT[] = [
  {
    label: 'Pending',
    value: 'pending',
    icon: Clock,
  },
  {
    label: 'Approved',
    value: 'approved',
    icon: CheckCheck,
  },
  {
    label: 'Rejected',
    value: 'rejected',
    icon: CircleX,
  },
];

export const RequestType: RequestT[] = [
  {
    label: 'Leave',
    value: 'leave',
  },
  {
    label: 'Overtime',
    value: 'overtime',
  },
  {
    label: 'Travel',
    value: 'travel',
  },
  {
    label: 'Training',
    value: 'training',
  },
  {
    label: 'Promotion',
    value: 'promotion',
  },
  {
    label: 'Meeting',
    value: 'meeting',
  },
  {
    label: 'Other',
    value: 'other',
  },
];
