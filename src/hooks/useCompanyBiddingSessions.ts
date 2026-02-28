import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { biddingApi } from '@/api/bidding/bidding.api';
import type {
  CompanyBiddingSessionsQueryParams,
  CompanyBiddingSessionsResponse,
} from '@/api/bidding/bidding.types';

export const useCompanyBiddingSessions = (
  companyId: string,
  params: CompanyBiddingSessionsQueryParams,
) => {
  return useQuery<CompanyBiddingSessionsResponse>({
    queryKey: [
      'company-bidding-sessions',
      companyId,
      params.page ?? 1,
      params.limit ?? 20,
      params.sortBy ?? 'createdAt',
      params.sortDir ?? 'DESC',
      params.status ?? '',
      params.dateFrom ?? '',
      params.dateTo ?? '',
      params.operationalLocationId ?? '',
    ],
    queryFn: () => biddingApi.getCompanySessions(companyId, params),
    enabled: Boolean(companyId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
