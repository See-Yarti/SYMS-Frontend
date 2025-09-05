// src/hooks/useCompanyTaxes.ts
import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from './useCompanyApi';

export interface CompanyTaxItem {
  id: string;
  locationId: string;
  title: string;
  description: string;
  percentage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTaxDetail {
  id: string;
  location: {
    id: string;
    country: string;
    state: string;
    city: string;
    addressLine: string;
    isAirportZone: boolean;
  };
  title: string;
  description: string;
  percentage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTaxListResponse {
  success: boolean;
  data: {
    items: CompanyTaxItem[];
    page: number;
    limit: number;
    total: number;
  };
  timestamp: string;
}

export interface CompanyTaxDetailResponse {
  success: boolean;
  data: CompanyTaxDetail;
  timestamp: string;
}

export interface CreateTaxBody {
  title: string;
  locationId: string;
  description?: string;
  percentage: string; // "5.00"
}

export interface UpdateTaxBody {
  title?: string;
  description?: string;
  percentage?: string; // "7.50"
}

// ------- QUERIES -------
export const useCompanyTaxes = (companyId: string, enabled = true) =>
  useQuery<CompanyTaxListResponse, Error>({
    queryKey: ['company-taxes', companyId],
    queryFn: async () => {
      // Fetch with a high limit to avoid missing items due to pagination
      const { data } = await axiosInstance.get(
        `/company-location-taxes/${companyId}?page=1&limit=1000`,
      );
      return data;
    },
    enabled: !!companyId && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

export const useCompanyTax = (
  companyId: string,
  taxId: string,
  enabled = true,
) =>
  useQuery<CompanyTaxDetailResponse, Error>({
    queryKey: ['company-tax', companyId, taxId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/company-location-taxes/${companyId}/tax/${taxId}`,
      );
      return data;
    },
    enabled: !!companyId && !!taxId && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

// ------- MUTATIONS -------
export const useCreateCompanyTax = (companyId: string) =>
  useMutation<CompanyTaxDetailResponse, Error, CreateTaxBody>({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post(
        `/company-location-taxes/${companyId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-taxes', companyId] });
    },
  });

export const useUpdateCompanyTax = (companyId: string) =>
  useMutation<
    CompanyTaxDetailResponse,
    Error,
    { taxId: string; payload: UpdateTaxBody }
  >({
    mutationFn: async ({ taxId, payload }) => {
      const { data } = await axiosInstance.patch(
        `/company-location-taxes/${companyId}/tax/${taxId}`,
        payload,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['company-taxes', companyId] });
      queryClient.invalidateQueries({
        queryKey: ['company-tax', companyId, vars.taxId],
      });
    },
  });

export const useToggleCompanyTax = (companyId: string) =>
  useMutation<CompanyTaxDetailResponse, Error, { taxId: string }>({
    mutationFn: async ({ taxId }) => {
      const { data } = await axiosInstance.patch(
        `/company-location-taxes/${companyId}/tax/${taxId}/toggle`,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['company-taxes', companyId] });
      queryClient.invalidateQueries({
        queryKey: ['company-tax', companyId, vars.taxId],
      });
    },
  });

export const useDeleteCompanyTax = (companyId: string) =>
  useMutation<
    { success: boolean; data: { deleted: boolean } },
    Error,
    { taxId: string }
  >({
    mutationFn: async ({ taxId }) => {
      const { data } = await axiosInstance.delete(
        `/company-location-taxes/${companyId}/tax/${taxId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-taxes', companyId] });
    },
  });