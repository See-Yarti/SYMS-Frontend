import { axiosInstance } from '@/lib/API';
import { Booking, BookingApiResult, BookingMeta } from '@/types/booking';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export type AllBookingQueryParams = {
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
};

export const useAllBookings = ({
  search,
  sortDir = 'DESC',
  dateFrom,
  dateTo,
  page = 1,
  limit = 10,
}: AllBookingQueryParams) => {
  return useQuery<BookingApiResult>({
    queryKey: ['all-bookings', search ?? '', sortDir, dateFrom ?? '', dateTo ?? '', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('q', search.trim());
      if (sortDir) params.append('sortDir', sortDir);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));

      const endpoint = `/booking/get-all-bookings`;
      const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

      const { data } = await axiosInstance.get(url);

      return normalizeResponse(data, {
        ...DEFAULT_META,
        page,
        limit,
      });
    },
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
