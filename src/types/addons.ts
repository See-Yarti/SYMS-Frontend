export interface LocationAddonItem {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  perDayRate: number | null;
}

export interface LocationAddonsResponse {
  locationId: string;
  addons: LocationAddonItem[];
}

export interface UpdateLocationAddonsPayload {
  addons: Array<{
    key: string;
    perDayRate: number | null;
  }>;
}
