// src/hooks/useCDWApi.ts

import { useMutation } from '@tanstack/react-query';
import { useFetchData } from './useOperatorCarClass';
import { apiClient } from '@/api/client';
import type {
  CompanySettingsResponse,
  LocationCDWSettings,
  UpdateCompanyCDWPayload,
  UpdateLocationCDWFullPayload,
  CDWApiResponse,
} from '@/types/cdw';

/**
 * GET company settings (includes CDW settings)
 * Endpoint: GET /company-settings/:companyId
 * Note: useFetchData already extracts data.data from response
 */
export const useGetCompanySettings = (companyId: string) => {
  return useFetchData<CompanySettingsResponse>(
    companyId ? `company-settings/${companyId}` : '',
    ['company-cdw-settings', companyId], // Different key to avoid conflicts with usePlansApi
    {
      enabled: !!companyId,
      retry: (failureCount: number, error: any) => {
        // Don't retry on 429 (rate limit) - wait instead
        if (error?.response?.status === 429) return false;
        return failureCount < 2;
      },
      staleTime: 30_000, // Consider data fresh for 30 seconds to reduce API calls
      refetchOnMount: 'always', // Refetch when component mounts
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  );
};

/**
 * PATCH company CDW settings (admin only)
 * Endpoint: POST /company-settings/:companyId/cdw-settings
 */
export const useUpdateCompanyCDWSettings = (companyId: string) => {
  return useMutation({
    mutationFn: async (payload: UpdateCompanyCDWPayload) => {
      const response = await apiClient.post<
        CDWApiResponse<CompanySettingsResponse>
      >(`company-settings/${companyId}/cdw-settings`, payload);
      return response.data;
    },
    // Don't show toast or invalidate here - let the caller handle it once all saves are done
    onError: (error: any) => {
      console.error('Update company CDW settings error:', error);
    },
  });
};

/**
 * GET location CDW settings
 * Endpoint: GET /operator/locations/cdw-settings/:locationId
 * Note: useFetchData already extracts data.data from response
 */
export const useGetLocationCDWSettings = (locationId: string) => {
  return useFetchData<LocationCDWSettings>(
    locationId ? `operator/locations/cdw-settings/${locationId}` : '',
    ['location-cdw-settings', locationId],
    {
      enabled: !!locationId,
      retry: 1,
      staleTime: 0, // Always consider data stale to ensure fresh data
      refetchOnMount: true, // Refetch when component mounts
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  );
};

/**
 * PUT location CDW settings (full - recommended)
 * Endpoint: PUT /operator/locations/cdw-settings/:locationId/full
 */
export const useUpdateLocationCDWSettings = (locationId: string) => {
  return useMutation({
    mutationFn: async (payload: UpdateLocationCDWFullPayload) => {
      const response = await apiClient.put<
        CDWApiResponse<LocationCDWSettings>
      >(`operator/locations/cdw-settings/${locationId}/full`, payload);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Update location CDW settings error:', error);
    },
  });
};

/**
 * Validation helper: Check if CDW percentage is within admin range
 */
export const validateCDWPercentage = (
  percentage: number,
  minPercentage: string | number,
  maxPercentage: string | number,
): { valid: boolean; message?: string } => {
  const min =
    typeof minPercentage === 'string'
      ? parseFloat(minPercentage)
      : minPercentage;
  const max =
    typeof maxPercentage === 'string'
      ? parseFloat(maxPercentage)
      : maxPercentage;

  if (percentage < min || percentage > max) {
    return {
      valid: false,
      message: `CDW percentage must be between ${min}% and ${max}%`,
    };
  }

  return { valid: true };
};

/**
 * Validation helper: Check if min < max for company CDW settings
 */
export const validateCDWRange = (
  minPercentage: number,
  maxPercentage: number,
): { valid: boolean; message?: string } => {
  if (minPercentage >= maxPercentage) {
    return {
      valid: false,
      message: 'Minimum percentage must be less than maximum percentage',
    };
  }

  if (
    minPercentage < 0 ||
    minPercentage > 100 ||
    maxPercentage < 0 ||
    maxPercentage > 100
  ) {
    return {
      valid: false,
      message: 'Percentages must be between 0 and 100',
    };
  }

  return { valid: true };
};
