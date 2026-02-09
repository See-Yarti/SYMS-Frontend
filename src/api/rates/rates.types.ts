// Rates API Types
export interface RatesQueryParams {
  carClassId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface Rate {
  id: string;
  carClassId: string;
  locationId: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatesResponse {
  data: {
    rates: Rate[];
  };
}

export interface RateResponse {
  data: {
    rate: Rate;
  };
}

export interface CreateRateRequest {
  carClassId: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  startDate: string;
  endDate: string;
}

export interface UpdateRateRequest extends Partial<CreateRateRequest> {}

export interface BlackoutRequest {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface BlackoutResponse {
  data: {
    blackouts: any[];
  };
}

export interface TaxRequest {
  name: string;
  percentage: number;
  isActive: boolean;
}

export interface TaxResponse {
  data: {
    taxes: any[];
  };
}

export interface CDWRequest {
  carClassId: string;
  dailyRate: number;
  coverageAmount: number;
}

export interface CDWResponse {
  data: {
    cdw: any[];
  };
}
