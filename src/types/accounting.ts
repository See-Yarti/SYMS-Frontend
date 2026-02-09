// src/types/accounting.ts

export type AccountingType =
  | 'BOOKING_COMPLETED'
  | 'NO_SHOW'
  | 'FREE_CANCEL'
  | 'LATE_CANCEL'
  | 'CUSTOMER_FAULT'
  | 'OPERATOR_FAULT'
  | 'PARTIAL_USE';

export type AccountingStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING';
export type PaidStatus = 'PREPAID' | 'POSTPAID';

export interface AccountingItem {
  id: string;
  type: AccountingType;
  bookingid: string;
  bookingcode?: string;
  companyname?: string;
  companyid?: string;
  status: AccountingStatus;
  paidstatus: PaidStatus;
  pickupat: string;
  dropat: string;
  customerrefund: string;
  operatorpayout: string;
  yalacommission: string;
  commissiontype?: string;
  commissionvalue?: string;
  commissionrateapplied?: string;
  amountowed?: string;
  createdat: string;
}

export interface CompanyAccountingItem {
  bookingId?: string;
  bookingCode: string;
  customerName: string;
  carClass: string;
  pickupDate: string;
  pickupLocation: string;
  bookingStatus: string;
  bookingType: string;
  netBooking: string;
}

export interface AccountingSummary {
  totalRefund: string;
  totalPayout: string;
  totalCommission: string;
  totalOwes: string;
  totalRecords: number;
}

export interface AccountingMeta {
  ok: boolean;
  total: number;
  page: number;
  limit: number;
}

export interface AccountingApiResult {
  ok: boolean;
  total: number;
  page: number;
  limit: number;
  summary: AccountingSummary;
  items: (AccountingItem | CompanyAccountingItem)[];
}

export interface AccountingResponse {
  success: boolean;
  data: AccountingApiResult;
  timestamp: string;
}
