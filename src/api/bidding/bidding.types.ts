export type BiddingSessionStatus =
  | 'ACTIVE'
  | 'ACCEPTED'
  | 'LOCKED'
  | 'CANCELLED'
  | 'COMPLETED';

export type BiddingSessionListSortBy =
  | 'createdAt'
  | 'pickupAt'
  | 'dropAt'
  | 'status';

export interface CompanyBiddingSessionsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: BiddingSessionListSortBy;
  sortDir?: 'ASC' | 'DESC';
  status?: BiddingSessionStatus;
  dateFrom?: string;
  dateTo?: string;
  operationalLocationId?: string;
}

export interface BiddingSessionLocationInfo {
  id: string;
  city?: string | null;
  addressLine?: string | null;
  title?: string | null;
}

export interface CompanyBiddingSessionItem {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  carClass: string | null;
  pickupDate: string | null;
  dropDate: string | null;
  pickupTime: string | null;
  dropTime: string | null;
  location: BiddingSessionLocationInfo | null;
  actualRentalAmount: number | null;
  currency: string | null;
  bidAttemptNo: number | null;
  bidAmount1: number | null;
  bidAmount2: number | null;
  bidAmount3: number | null;
  bidStatus: 'Passed' | 'Failed' | null;
  status: BiddingSessionStatus;
  reason: string | null;
  approvalBid: number | null;
  acceptedAt: string | null;
  expiresAt: string | null;
  lockEndAt: string | null;
  createdAt: string;
}

export interface CompanyBiddingSessionsResponse {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  items: CompanyBiddingSessionItem[];
}
