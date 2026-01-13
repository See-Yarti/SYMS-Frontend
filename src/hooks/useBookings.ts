// src/hooks/useBookings.ts

import { axiosInstance } from '@/lib/API';
import { useAppSelector } from '@/store';
import { Booking, BookingApiResult, BookingMeta, BookingDetail, CancelBookingPayload, CancelBookingResponse } from '@/types/booking';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { queryClient } from '@/Provider';

export type BookingQueryParams = {
	search?: string;
	sortDir?: 'ASC' | 'DESC';
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
};

const DEFAULT_META: BookingMeta = {
	ok: true,
	page: 1,
	limit: 10,
	total: 0,
};

const normalizeResponse = (data: unknown, fallbackMeta: BookingMeta) => {
	if (!data || typeof data !== 'object') {
		return { bookings: [] as Booking[], meta: fallbackMeta } satisfies BookingApiResult;
	}

	// Match the actual API response structure
	const responseData = (data as any)?.data;
	if (!responseData) {
		return { bookings: [] as Booking[], meta: fallbackMeta } satisfies BookingApiResult;
	}

	const bookings: Booking[] = Array.isArray(responseData.items) ? responseData.items : [];

	const meta: BookingMeta = {
		ok: responseData.ok ?? true,
		page: Number(responseData.page ?? fallbackMeta.page),
		limit: Number(responseData.limit ?? fallbackMeta.limit),
		total: Number(responseData.total ?? bookings.length),
	};

	return { bookings, meta } satisfies BookingApiResult;
};export const useBookings = ({
	search,
	sortDir = 'DESC',
	dateFrom,
	dateTo,
	page = 1,
	limit = 10,
}: BookingQueryParams) => {
	const { companyId, user, otherInfo } = useAppSelector((state) => state.auth);
	const operatorRole = user?.operatorRole ?? otherInfo?.operatorRole;
	const isOperator = user?.role === 'operator';
	const canAccess = (isOperator || Boolean(operatorRole)) && Boolean(companyId);

	return useQuery<BookingApiResult>({
		queryKey: [
			'bookings',
			companyId,
			search ?? '',
			sortDir,
			dateFrom ?? '',
			dateTo ?? '',
			page,
			limit,
		],
		queryFn: async () => {
			if (!companyId) {
				return { bookings: [], meta: { ...DEFAULT_META, page, limit } };
			}

		const params: Record<string, string> = {};
		if (search && search.trim()) {
			params.q = search.trim();
		}
		if (sortDir) {
			params.sortDir = sortDir;
		}
		if (dateFrom) {
			params.dateFrom = dateFrom;
		}
		if (dateTo) {
			params.dateTo = dateTo;
		}
		if (page) {
			params.page = String(page);
		}
		if (limit) {
			params.limit = String(limit);
		}

		const endpoint = `/booking/get-bookings-of-company/${companyId}`;
		const { data } = await axiosInstance.get(endpoint, { params });

		return normalizeResponse(data, {
			...DEFAULT_META,
			page,
			limit,
		});
		},
		placeholderData: keepPreviousData,
		enabled: canAccess,
		retry: false,
		staleTime: 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
};

// Hook to fetch booking by ID
export const useBookingById = (bookingId: string | undefined) => {
	return useQuery<BookingDetail>({
		queryKey: ['booking', bookingId],
		queryFn: async () => {
			if (!bookingId) {
				throw new Error('Booking ID is required');
			}

			const endpoint = `/booking/get-booking-by-id/${bookingId}`;
			const { data } = await axiosInstance.get(endpoint);

			// Extract the data from response.data.data
			if (data?.success && data?.data) {
				return data.data;
			}

			throw new Error('Failed to fetch booking details');
		},
		enabled: !!bookingId,
		retry: false,
		staleTime: 60 * 1000,
	});
};

// Hook to cancel a booking
export const useCancelBooking = () => {
	return useMutation<CancelBookingResponse, Error, { bookingId: string; companyId: string; payload: CancelBookingPayload }>({
		mutationFn: async ({ bookingId, companyId, payload }) => {
			if (!companyId) {
				throw new Error('Company ID is required');
			}
			// PATCH /api/booking/cancel-booking/:bookingId/:companyId
			const response = await axiosInstance.patch(`/booking/cancel-booking/${bookingId}/${companyId}`, payload);
			// API returns { success: true, data: {...} }, extract the data
			return response.data?.data || response.data;
		},
		onSuccess: (_data, variables) => {
			// Invalidate booking queries
			queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
			queryClient.invalidateQueries({ queryKey: ['bookings'] });
		},
		retry: false,
	});
};
