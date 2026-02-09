// src/hooks/useCompanyApi.ts:

import { apiClient } from '@/api/client';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import {
  CompaniesResponse,
  CompanyResponse,
  UnverifyCompanyPayload,
  VerificationResponse,
} from '@/types/company';
import { queryClient } from '@/app/providers';

// Shared query options
const defaultQueryOptions = {
  retry: false,
  staleTime: 60 * 1000, // 1 minute
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

// ADVANCED QUERY HOOK
export type CompanyQueryParams = {
  search?: string;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
};

// After a verify/unverify, always refresh companies & company details in cache!
export const useVerifyCompany = () => {
  return useMutation<VerificationResponse, Error, string>({
    mutationFn: async (companyId: string) => {
      const { data } = await apiClient.patch(
        `/company/company-verify/${companyId}`,
      );
      return data;
    },
    onSuccess: (_data, companyId) => {
      // Invalidate companies list and this specific company’s details
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
    retry: false,
  });
};

export const useUnverifyCompany = () => {
  return useMutation<
    VerificationResponse,
    Error,
    { companyId: string; payload: UnverifyCompanyPayload }
  >({
    mutationFn: async ({ companyId, payload }) => {
      const { data } = await apiClient.patch(
        `/company/company-un-verify/${companyId}`,
        payload,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      // Same here: update both the companies list and the specific company in the UI
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({
        queryKey: ['company', variables.companyId],
      });
    },
    retry: false,
  });
};

export const useGetCompany = (companyId: string) => {
  return useQuery<CompanyResponse, Error>({
    ...defaultQueryOptions,
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/company/${companyId}`);
      return data;
    },
    enabled: !!companyId,
  });
};

export const useGetCompanies = ({
  search,
  isVerified,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
  page = 1,
  limit = 10,
}: CompanyQueryParams) => {
  return useQuery<CompaniesResponse, Error>({
    queryKey: ['companies', search, isVerified, sortBy, sortOrder, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeof isVerified === 'boolean')
        params.append('isVerified', String(isVerified));
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (page) params.append('page', String(page));
      if (limit) params.append('limit', String(limit));
      const { data } = await apiClient.get(`/company?${params.toString()}`);
      return data;
    },
    placeholderData: keepPreviousData,
    ...defaultQueryOptions,
  });
};

// Check if company key is available
export interface CheckCompanyKeyResponse {
  available: boolean;
  message?: string;
}

export const useCheckCompanyKey = (companyKey: string) => {
  return useQuery<CheckCompanyKeyResponse, Error>({
    queryKey: ['company-key-check', companyKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/company/check-key/${companyKey}`,
      );
      return data;
    },
    enabled:
      !!companyKey &&
      companyKey.length >= 2 &&
      companyKey.length <= 3 &&
      /^[A-Z]+$/.test(companyKey),
    ...defaultQueryOptions,
    staleTime: 0, // Always check fresh
  });
};

// Get company key suggestions
export interface SuggestKeysResponse {
  suggestions: string[];
}

export interface SuggestKeysRequest {
  name: string;
}

export const useSuggestCompanyKeys = () => {
  return useMutation<SuggestKeysResponse, Error, SuggestKeysRequest>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        '/company/suggest-keys',
        payload,
      );
      return data.data;
    },
    retry: false,
  });
};

// Soft delete company
export interface DeleteCompanyResponse {
  success: boolean;
  message?: string;
}

export const useDeleteCompany = () => {
  return useMutation<DeleteCompanyResponse, Error, string>({
    mutationFn: async (companyId: string) => {
      const { data } = await apiClient.delete(
        `/company/soft-delete/${companyId}`,
      );
      return data;
    },
    onSuccess: (_data, companyId) => {
      // Invalidate companies list and this specific company's details
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
    retry: false,
  });
};

// Update company
export interface UpdateCompanyPayload {
  name?: string;
  description?: string;
  tradeLicenseExpiryDate?: string;
  companyKey?: string;
  // Files will be sent as FormData
}

export interface UpdateCompanyResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const useUpdateCompany = () => {
  return useMutation<
    UpdateCompanyResponse,
    Error,
    { companyId: string; payload: FormData | UpdateCompanyPayload }
  >({
    mutationFn: async ({ companyId, payload }) => {
      // Check if payload is FormData (has files) or plain object
      const isFormData = payload instanceof FormData;
      const { data } = await apiClient.patch(
        `/company/update/${companyId}`,
        payload,
        {
          headers: isFormData
            ? { 'Content-Type': 'multipart/form-data' }
            : { 'Content-Type': 'application/json' },
        },
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate companies list and this specific company's details
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({
        queryKey: ['company', variables.companyId],
      });
    },
    retry: false,
  });
};
