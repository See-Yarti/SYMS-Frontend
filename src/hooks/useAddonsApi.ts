import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryClient } from '@/app/providers';
import type {
  LocationAddonsResponse,
  UpdateLocationAddonsPayload,
} from '@/types/addons';

export const useGetLocationAddons = (locationId: string) => {
  return useQuery<LocationAddonsResponse>({
    queryKey: ['location-addons', locationId],
    queryFn: async () => {
      const { data } = await apiClient.get<
        LocationAddonsResponse | { data: LocationAddonsResponse }
      >(
        `addons/location/${locationId}`,
      );
      return (data && typeof data === 'object' && 'data' in data
        ? data.data
        : data) as LocationAddonsResponse;
    },
    enabled: !!locationId,
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateLocationAddons = (locationId: string) => {
  return useMutation({
    mutationFn: async (payload: UpdateLocationAddonsPayload) => {
      const { data } = await apiClient.put<
        LocationAddonsResponse | { data: LocationAddonsResponse }
      >(
        `addons/location/${locationId}`,
        payload,
      );
      return (data && typeof data === 'object' && 'data' in data
        ? data.data
        : data) as LocationAddonsResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['location-addons', locationId],
      });
    },
  });
};
