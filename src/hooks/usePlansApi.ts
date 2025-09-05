import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CompanySettingsResponse,
  PlanConfigsResponse,
  StartSubscriptionBody,
  StartSubscriptionResponse,
  OverrideCommissionBody,
  GenericOk,
  Tier,
} from '@/types/company';
import { queryClient } from './useCompanyApi';

// ------- QUERIES -------

export const useGetCompanySettings = (companyId: string) =>
  useQuery<CompanySettingsResponse, Error>({
    queryKey: ['company-settings', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/company-settings/${companyId}`
      );
      return data;
    },
    enabled: !!companyId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

export const useEnsureDefaultPlans = () =>
  useMutation<PlanConfigsResponse, Error, void>({
    mutationFn: async () => {
      const { data } = await axiosInstance.post(
        `/plan-configs/create-defaults-if-missing`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-configs'] });
    },
  });

export const useGetPlanConfigs = () =>
  useQuery<PlanConfigsResponse, Error>({
    queryKey: ['plan-configs'],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/plan-configs`);
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
      const { data } = await axiosInstance.post(
        `/company-settings/${companyId}/commission-override`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

export const useStartCompanySubscription = (companyId: string) =>
  useMutation<StartSubscriptionResponse, Error, StartSubscriptionBody>({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post(
        `/companies/${companyId}/subscriptions`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

// Convenience: read single plan (optional)
export const getPlanByTier = (configs: PlanConfigsResponse | undefined, tier: Tier) =>
  configs?.data.find((c) => c.tier === tier);


// --- Delete commission override ---
export const useDeleteCommissionOverride = (companyId: string) =>
  useMutation<GenericOk, Error, void>({
    mutationFn: async () => {
      const { data } = await axiosInstance.delete(
        `/company-settings/${companyId}/commission-override`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

// --- POST: End subscription early / actions ---
type EndEarlyAction = 'START_NEXT_SCHEDULED' | 'REVERT_TO_BASE' | 'START_TIER_NOW';
interface EndEarlyBody {
  action: EndEarlyAction;
  note?: string;
  tier?: Tier;   // required when action === 'START_TIER_NOW'
  days?: number; // required when action === 'START_TIER_NOW'
}

export const useEndCompanySubscriptionEarly = (companyId: string) =>
  useMutation<GenericOk, Error, EndEarlyBody>({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post(
        `/companies/${companyId}/subscriptions/end-early`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });