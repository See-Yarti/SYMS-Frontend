// src/hooks/useApi.ts:

import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import {
  CompaniesResponse,
  CompanyResponse,
  UnverifyCompanyPayload,
  VerificationResponse,
} from '@/types/company';

export const useFetchData = (endpoint: string, queryKey: string) => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await axiosInstance.get(endpoint);
      return data;
    },
    retry: false, // Prevent React Query from retrying on its own (Axios handles it)
  });
};
interface InfiniteQueryOptions {
  queryKey: string;
  endpoint: string;
  limit?: number;
  extraParams?: Record<string, any>;
  pageParamKey?: string; // Customizable page parameter key (e.g., 'cursor')
  limitParamKey?: string; // Customizable limit key (e.g., 'per_page')
}

// Get Data Hook with Pagination
export const useFetchInfiniteData = ({
  queryKey,
  endpoint,
  limit = 10,
  extraParams = {},
}: InfiniteQueryOptions) => {
  return useInfiniteQuery({
    queryKey: [queryKey, extraParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axiosInstance.get(endpoint, {
        params: { page: pageParam, limit, ...extraParams },
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // return lastPage?.hasNextPage ? allPages.length + 1 : undefined;
      if (lastPage.length === 0) {
        return undefined;
      }
      return allPages.length + 1;
    },
    retry: false,
  });
};
// Post Data Hook
// Updated usePostData hook with better typing and file upload support
export const usePostData = <TData = unknown, TResponse = unknown>(
  endpoint: string,
) => {
  return useMutation<TResponse, Error, TData>({
    mutationFn: async (data: TData) => {
      const { data: responseData } = await axiosInstance.post(endpoint, data);
      return responseData;
    },
  });
};

// Specialized hook for file uploads
export const useUploadFile = <TResponse = unknown>(endpoint: string) => {
  return useMutation<TResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data } = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
};

// src/hooks/useApi.ts (add this to your existing file)
export const useDeleteVendor = () => {
  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { data } = await axiosInstance.delete(`/vendor/${vendorId}`);
      return data;
    },
  });
};

// Get all companies
export const useGetCompanies = () => {
  return useQuery<CompaniesResponse, Error>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/company');
      return data;
    },
  });
};

// Get single company by ID
export const useGetCompany = (companyId: string) => {
  return useQuery<CompanyResponse, Error>({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/company/${companyId}`);
      return data;
    },
    enabled: !!companyId, // Only run query if companyId exists
  });
};

// Verify a company
export const useVerifyCompany = () => {
  return useMutation<VerificationResponse, Error, string>({
    mutationFn: async (companyId: string) => {
      const { data } = await axiosInstance.patch(
        `/company/company-verify/${companyId}`,
      );
      return data;
    },
  });
};

// Unverify a company
export const useUnverifyCompany = () => {
  return useMutation<
    VerificationResponse, 
    Error, 
    { companyId: string; payload: UnverifyCompanyPayload }
  >({
    mutationFn: async ({ companyId, payload }) => {
      const { data } = await axiosInstance.patch(
        `/company/company-un-verify/${companyId}`,
        payload
      );
      return data;
    },
  });
};
