// Bidding API types - matches backend SetLocationBiddingDto and getLocationBiddingConfig response

export type BiddingMode = 'global' | 'per_car_class';

export interface CarClassAtLocation {
  id: string; // companyCarClassId
  carClassId?: string;
  name: string;
}

export interface CarClassBiddingItem {
  companyCarClassId: string;
  carClassId?: string;
  biddingDailyPct?: number | null;
  biddingWeeklyPct?: number | null;
  biddingMonthlyPct?: number | null;
}

export interface LocationBiddingConfig {
  locationId: string;
  biddingAllowedByAdmin: boolean;
  biddingEnabled: boolean;
  biddingMode?: BiddingMode;
  biddingDailyPct?: number;
  biddingWeeklyPct?: number;
  biddingMonthlyPct?: number;
  carClassBiddings?: CarClassBiddingItem[];
  carClassesAtLocation: CarClassAtLocation[];
}

export interface BiddingPercentagesPayload {
  biddingDailyPct?: number | null;
  biddingWeeklyPct?: number | null;
  biddingMonthlyPct?: number | null;
}

export interface CarClassBiddingPayload {
  companyCarClassId: string;
  biddingDailyPct?: number | null;
  biddingWeeklyPct?: number | null;
  biddingMonthlyPct?: number | null;
}

export interface SetLocationBiddingPayload {
  biddingEnabled: boolean;
  biddingMode?: BiddingMode;
  globalPercentages?: BiddingPercentagesPayload;
  carClassBiddings?: CarClassBiddingPayload[];
}
