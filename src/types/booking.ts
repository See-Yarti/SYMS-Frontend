// src/types/booking.ts

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | string;

export type PaidStatus = 'PREPAID' | 'POSTPAID' | string;

export type BookingTotals = {
  subTotal: string;
  taxTotal: string;
  grandTotal: string;
};

export type OperationalLocation = {
  id: string;
  city: string;
  addressLine: string;
  lat: number;
  lng: number;
};

export type Car = {
  id: string;
  make: string;
  model: string;
  passengers: number;
  doors: number;
  bags: number;
};

export type LocationPoint = {
  addressLine: string;
  lat: number;
  lng: number;
};

export type BookingCompany = {
  id: string;
  name: string;
  logo: string | null;
};

export type Booking = {
  id: string;
  bookingCode?: string;
  status: BookingStatus;
  paidStatus: PaidStatus;
  pickupAt: string;
  dropAt: string;
  currency: string;
  totals: BookingTotals;
  operationalLocation: OperationalLocation;
  car: Car;
  company?: BookingCompany;
  pickup?: LocationPoint;
  dropoff?: LocationPoint;
  createdAt: string;
};

export type BookingMeta = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
};

export type BookingApiResult = {
  bookings: Booking[];
  meta: BookingMeta;
};
