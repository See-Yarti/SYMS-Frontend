import { apiClient } from '@/api/client';
import type {
  CompanyBiddingSessionsQueryParams,
  CompanyBiddingSessionsResponse,
} from './bidding.types';

export const biddingApi = {
  getCompanySessions: async (
    companyId: string,
    params: CompanyBiddingSessionsQueryParams = {},
  ): Promise<CompanyBiddingSessionsResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    if (params.status) query.set('status', params.status);
    if (params.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params.dateTo) query.set('dateTo', params.dateTo);
    if (params.operationalLocationId) {
      query.set('operationalLocationId', params.operationalLocationId);
    }

    const endpoint = `/bidding/sessions/company/${companyId}`;
    const url = query.toString() ? `${endpoint}?${query.toString()}` : endpoint;
    const { data } = await apiClient.get<CompanyBiddingSessionsResponse>(url);
    return data;
  },
};
