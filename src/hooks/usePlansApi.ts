import { apiClient } from '@/api/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CompanySettingsResponse,
  PlanConfigsResponse,
  StartSubscriptionBody,
  StartSubscriptionResponse,
  OverrideCommissionBody,
  GenericOk,
  Tier,
  StatusCommissionSettingsPayload,
  SetStatusCommissionSettingsResponse,
  FixedCancellationAmountsPayload,
  SetFixedCancellationAmountsResponse,
  EdgeCaseHandlingPayload,
  SetEdgeCaseHandlingResponse,
} from '@/types/company';
import { queryClient } from '@/app/providers';

// ------- QUERIES -------

export const useGetCompanySettings = (companyId: string) =>
  useQuery<CompanySettingsResponse, Error>({
    queryKey: ['company-settings', companyId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/company-settings/${companyId}`,
      );
      return data;
    },
    enabled: !!companyId,
    staleTime: 30_000, // Consider data fresh for 30 seconds to reduce API calls
    refetchOnMount: 'always', // Refetch when component mounts
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 429 (rate limit)
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
  });

export const useGetPlanConfigs = () =>
  useQuery<PlanConfigsResponse, Error>({
    queryKey: ['plan-configs'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/plan-configs`);
      return data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

// ------- MUTATIONS -------

export const useSetCommissionOverride = (companyId: string) =>
  useMutation<GenericOk, Error, OverrideCommissionBody>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/company-settings/${companyId}/commission-override`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-settings', companyId],
      });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

export const useStartCompanySubscription = (companyId: string) =>
  useMutation<StartSubscriptionResponse, Error, StartSubscriptionBody>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/companies/${companyId}/subscriptions`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-settings', companyId],
      });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

// Convenience: read single plan (optional)
export const getPlanByTier = (
  configs: PlanConfigsResponse | undefined,
  tier: Tier,
) => configs?.data.find((c) => c.tier === tier);

// Set status commission settings (includes edge case handling)
export const useSetStatusCommissionSettings = (companyId: string) =>
  useMutation<
    SetStatusCommissionSettingsResponse,
    Error,
    StatusCommissionSettingsPayload & { edgeCaseHandling?: 'OWE' | 'CAP' }
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/company-settings/${companyId}/status-commission-settings`,
        payload,
      );
      return data;
    },
    // Don't invalidate here - let the caller handle it once all saves are done
  });

// Set fixed cancellation amounts
export const useSetFixedCancellationAmounts = (companyId: string) =>
  useMutation<
    SetFixedCancellationAmountsResponse,
    Error,
    FixedCancellationAmountsPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/company-settings/${companyId}/fixed-cancellation-amounts`,
        payload,
      );
      return data;
    },
    // Don't invalidate here - let the caller handle it once all saves are done
  });

// Set edge case handling
export const useSetEdgeCaseHandling = (companyId: string) =>
  useMutation<SetEdgeCaseHandlingResponse, Error, EdgeCaseHandlingPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/company-settings/${companyId}/edge-case-handling`,
        payload,
      );
      return data;
    },
    // Don't invalidate here - let the caller handle it once all saves are done
  });

// --- Delete commission override ---
export const useDeleteCommissionOverride = (companyId: string) =>
  useMutation<GenericOk, Error, void>({
    mutationFn: async () => {
      const { data } = await apiClient.delete(
        `/company-settings/${companyId}/commission-override`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-settings', companyId],
      });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

// --- POST: End subscription early / actions ---
type EndEarlyAction =
  | 'START_NEXT_SCHEDULED'
  | 'REVERT_TO_BASE'
  | 'START_TIER_NOW';
interface EndEarlyBody {
  action: EndEarlyAction;
  note?: string;
  tier?: Tier; // required when action === 'START_TIER_NOW'
  days?: number; // required when action === 'START_TIER_NOW'
}

export const useEndCompanySubscriptionEarly = (companyId: string) =>
  useMutation<GenericOk, Error, EndEarlyBody>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/companies/${companyId}/subscriptions/end-early`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-settings', companyId],
      });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });
