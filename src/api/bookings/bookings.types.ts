// Bookings API Types
export interface BookingsQueryParams {
  search?: string;
  sortDir?: 'ASC' | 'DESC';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  // Add other booking fields
}

export interface BookingsResponse {
  data: {
    items: Booking[];
    ok: boolean;
    page: number;
    limit: number;
    total: number;
  };
}

export interface BookingDetailResponse {
  data: {
    booking: Booking;
  };
}

export interface CancelBookingRequest {
  reason: string;
  cancelledBy?: string;
}

export interface CancelBookingResponse {
  data: {
    message: string;
    booking: Booking;
  };
}

export interface CompleteBookingResponse {
  data: {
    message: string;
    booking: Booking;
  };
}
