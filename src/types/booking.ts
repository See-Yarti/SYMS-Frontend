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
  isAirportZone: any;
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

// Detailed booking response from get-booking-by-id
export type BookingDetail = {
  id: string;
  bookingCode: string;
  company: {
    id: string;
    baseCommissionRate: string;
    settings: {
      id: string;
      effectiveCommissionRate: string;
      commissionSource: string;
      currentTier: string;
      subscriptionEndsAt: string;
      overrideCommissionRate: string | null;
      overrideEndsAt: string | null;
    };
    logo: string | null;
    name: string;
    description: string;
    isVerified: boolean;
    unverifiedReason: string | null;
    unverifiedReasonDescription: string | null;
    unverifiedDate: string | null;
    taxNumber: string;
    taxFile: string;
    tradeLicenseFile: string;
    tradeLicenseIssueNumber: string;
    tradeLicenseExpiryDate: string;
    idProofFile: string | null;
    passportProofFile: string | null;
    utilityBillFile: string | null;
    createdAt: string;
    updatedAt: string;
  };
  operationalLocation: {
    id: string;
    country: string;
    state: string;
    city: string;
    addressLine: string;
    latitude: string;
    longitude: string;
    isAirportZone: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  companyCarClass: {
    id: string;
    make: string;
    model: string;
    isAvailable: boolean;
    description: string | null;
    numberOfBags: number;
    numberOfDoors: number;
    numberOfPassengers: number;
    overTimeAmountPerDay: string;
    overTimeAmountPerHour: string;
    depositAmount: string;
    isAutomationEnabled: boolean;
    isCustomKeepDurationEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  pickupAt: string;
  dropAt: string;
  pickupAddressLine: string;
  pickupLat: string;
  pickupLng: string;
  dropoffAddressLine: string;
  dropoffLat: string;
  dropoffLng: string;
  currency: string;
  subTotal: string;
  taxTotal: string;
  grandTotal: string;
  paidStatus: PaidStatus;
  status: BookingStatus;
  cancelledBy: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  consumer: any | null;
  driverName: string;
  confirmationName: string;
  confirmationEmail: string;
  country: string;
  phoneNumber: string;
  airline: string | null;
  flightNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

// Cancellation types
export type CancelType = 
  | 'FREE_CANCEL'
  | 'LATE_CANCEL'
  | 'NO_SHOW'
  | 'CUSTOMER_FAULT'
  | 'OPERATOR_FAULT'
  | 'PARTIAL_USE';

export interface CancelBookingPayload {
  cancelType: CancelType;
  note?: string;
}

export interface CancelBookingAccounting {
  cancelType: CancelType;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue?: string; // e.g., "10.00%"
  commissionRate: string; // e.g., "10.00"
  customerRefund: string;
  operatorPayout: string;
  yalaRideCommission: string;
  commissionAmount?: string;
  amountOwed: string;
}

export interface CancelBookingResponse {
  bookingId: string;
  status: 'CANCELLED';
  cancelledBy: 'COMPANY' | 'CUSTOMER' | 'ADMIN';
  cancelledAt: string;
  accounting: CancelBookingAccounting;
}
