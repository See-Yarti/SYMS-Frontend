// src/hooks/useBiddingApi.ts

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryClient } from '@/app/providers';
import type {
  LocationBiddingConfig,
  SetLocationBiddingPayload,
} from '@/types/bidding';

/**
 * GET location bidding config
 * Endpoint: GET /operator/locations/bidding-config/:locationId
 * Response: locationId, biddingAllowedByAdmin, biddingEnabled, biddingMode (when enabled),
 * biddingDailyPct/biddingWeeklyPct/biddingMonthlyPct (global), carClassBiddings (per_car_class),
 * carClassesAtLocation
 */
export const useGetLocationBiddingConfig = (locationId: string) => {
  return useQuery<LocationBiddingConfig>({
    queryKey: ['location-bidding-config', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<
        LocationBiddingConfig | { data: LocationBiddingConfig }
      >(`operator/locations/bidding-config/${locationId}`);
      return (data && typeof data === 'object' && 'data' in data
        ? data.data
        : data) as LocationBiddingConfig;
    },
    enabled: !!locationId,
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
  });
};

/**
 * PUT location bidding config
 * Endpoint: PUT /operator/locations/bidding-config/:locationId
 * Payload: biddingEnabled, biddingMode (global|per_car_class), globalPercentages or carClassBiddings
 * Percentages must be 50-100. At least one of daily/weekly/monthly required when enabling.
 */
export const useUpdateLocationBiddingConfig = (locationId: string) => {
  return useMutation({
    mutationFn: async (payload: SetLocationBiddingPayload) => {
      const { data } = await apiClient.put<
        { message?: string; data?: LocationBiddingConfig } | LocationBiddingConfig
      >(`operator/locations/bidding-config/${locationId}`, payload);
      return (data && typeof data === 'object' && 'data' in data
        ? data.data
        : data) as LocationBiddingConfig | undefined;
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({
        queryKey: ['location-bidding-config', locationId],
      });
    },
    onError: (error: unknown) => {
      console.error('Update location bidding config error:', error);
    },
  });
};
