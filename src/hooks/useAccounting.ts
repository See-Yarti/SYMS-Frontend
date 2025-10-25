// src/hooks/useAccounting.ts
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/API';
import { AccountingResponse } from '@/types/accounting';

interface AccountingParams {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Admin accounting hook
export const useAdminAccounting = (params: AccountingParams) => {
  return useQuery<AccountingResponse>({
    queryKey: ['admin-accounting', params],
    queryFn: async () => {
      // Use URLSearchParams for proper encoding like other hooks
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.page && params.page > 1) searchParams.append('page', String(params.page));
      if (params.limit && params.limit !== 20) searchParams.append('limit', String(params.limit));

      const queryString = searchParams.toString();
      const fullUrl = queryString ? `accounting/admin?${queryString}` : 'accounting/admin';

      console.log('Admin Accounting API Call:', {
        url: 'accounting/admin',
        params: {
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          page: params.page,
          limit: params.limit
        },
        queryString,
        fullUrl
      });

      const { data } = await axiosInstance.get(fullUrl);
      return data;
    },
    enabled: !!(params.dateFrom && params.dateTo),
  });
};

// Operator accounting hook
export const useOperatorAccounting = (companyId: string, params: AccountingParams) => {
  return useQuery<AccountingResponse>({
    queryKey: ['operator-accounting', companyId, params],
    queryFn: async () => {
      // Use URLSearchParams for proper encoding like other hooks
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.page && params.page > 1) searchParams.append('page', String(params.page));
      if (params.limit && params.limit !== 20) searchParams.append('limit', String(params.limit));

      const queryString = searchParams.toString();
      const fullUrl = queryString ? `accounting/company/${companyId}?${queryString}` : `accounting/company/${companyId}`;

      console.log('Operator Accounting API Call:', {
        url: `accounting/company/${companyId}`,
        companyId,
        params: {
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          page: params.page,
          limit: params.limit
        },
        queryString,
        fullUrl
      });

      const { data } = await axiosInstance.get(fullUrl);
      return data;
    },
    enabled: !!(companyId && params.dateFrom && params.dateTo),
  });
};
