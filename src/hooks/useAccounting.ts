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
      // Build query string like Postman - only include parameters that have values
      const queryParts: string[] = [];
      if (params.dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(params.dateFrom)}`);
      if (params.dateTo) queryParts.push(`dateTo=${encodeURIComponent(params.dateTo)}`);
      if (params.page && params.page > 1) queryParts.push(`page=${params.page}`);
      if (params.limit && params.limit !== 20) queryParts.push(`limit=${params.limit}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const fullUrl = `accounting/admin${queryString}`;

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
    enabled: true,
  });
};

// Operator accounting hook
export const useOperatorAccounting = (companyId: string, params: AccountingParams) => {
  return useQuery<AccountingResponse>({
    queryKey: ['operator-accounting', companyId, params],
    queryFn: async () => {
      // Build query string like Postman - only include parameters that have values
      const queryParts: string[] = [];
      if (params.dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(params.dateFrom)}`);
      if (params.dateTo) queryParts.push(`dateTo=${encodeURIComponent(params.dateTo)}`);
      if (params.page && params.page > 1) queryParts.push(`page=${params.page}`);
      if (params.limit && params.limit !== 20) queryParts.push(`limit=${params.limit}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const fullUrl = `accounting/company/${companyId}${queryString}`;

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
    enabled: !!companyId,
  });
};
