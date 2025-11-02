// src/hooks/useBookings.ts

import { axiosInstance } from '@/lib/API';
import { useAppSelector } from '@/store';
import { Booking, BookingApiResult, BookingMeta } from '@/types/booking';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

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
