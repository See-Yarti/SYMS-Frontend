// Bookings API Services
import { apiClient } from '../client';
import type {
  BookingsQueryParams,
  BookingsResponse,
  BookingDetailResponse,
  CancelBookingRequest,
  CancelBookingResponse,
  CompleteBookingResponse,
} from './bookings.types';

export const bookingsApi = {
  // Get operator bookings
  getOperatorBookings: async (
    params: BookingsQueryParams,
    companyId: string,
  ): Promise<BookingsResponse> => {
    const { data } = await apiClient.get('/booking/operator/bookings', {
      params: { ...params, companyId },
    });
    return data;
  },

  // Get all bookings (admin)
  getAllBookings: async (
    params: BookingsQueryParams,
  ): Promise<BookingsResponse> => {
    const { data } = await apiClient.get('/booking/bookings', { params });
    return data;
  },

  // Get booking by ID
  getBookingById: async (bookingId: string): Promise<BookingDetailResponse> => {
    const { data } = await apiClient.get(`/booking/${bookingId}`);
    return data;
  },

  // Cancel booking
  cancelBooking: async (
    bookingId: string,
    payload: CancelBookingRequest,
  ): Promise<CancelBookingResponse> => {
    const { data } = await apiClient.patch(
      `/booking/cancel/${bookingId}`,
      payload,
    );
    return data;
  },

  // Complete booking
  completeBooking: async (
    bookingId: string,
  ): Promise<CompleteBookingResponse> => {
    const { data } = await apiClient.patch(`/booking/complete/${bookingId}`);
    return data;
  },
};
