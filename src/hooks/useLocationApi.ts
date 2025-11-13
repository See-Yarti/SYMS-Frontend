// src/hoo/useLocationApi.ts:

import { axiosInstance } from '@/lib/API';
import {
  useQuery,
  useMutation,
  QueryClient,
} from '@tanstack/react-query';

// Shared query options
const defaultQueryOptions = {
  retry: false,
  staleTime: 60 * 1000, // 1 minute
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
  },
});

// Location Hooks

export const useGetLocations = (companyId: string) => {
  return useQuery({
    queryKey: ['locations', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/operator/locations/${companyId}`);
      return data;
    },
    enabled: !!companyId,
    ...defaultQueryOptions,
  });
};

export const useGetActiveLocations = (companyId: string) => {
  return useQuery({
    queryKey: ['locations', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/operator/locations/${companyId}/active-locations`);
      return data;
    },
    enabled: !!companyId,
    ...defaultQueryOptions,
  });
};


export const useCreateLocation = () => {
  return useMutation({
    mutationFn: async ({ companyId, payload }: { companyId: string; payload: any }) => {
      // Include companyId in the payload instead of URL
      const { data } = await axiosInstance.post('/operator/locations/create', {
        ...payload,
        companyId // Add companyId to the payload
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations', variables.companyId] });
    },
    retry: false,
  });
};

export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await axiosInstance.put(`/operator/locations/update/${id}`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', variables.id] });
    },
    retry: false,
  });
};

export const useToggleLocation = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.put(`/operator/locations/toggle-active-status/${id}`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', id] });
    },
    retry: false,
  });
};

// Check if location key is available
export interface CheckLocationKeyResponse {
  available: boolean;
  message?: string;
}

export const useCheckLocationKey = (locationKey: string) => {
  return useQuery<CheckLocationKeyResponse, Error>({
    queryKey: ['location-key-check', locationKey],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/operator/locations/check-key/${locationKey}`);
      return data;
    },
    enabled: !!locationKey && locationKey.length >= 2 && locationKey.length <= 3 && /^[A-Z]+$/.test(locationKey),
    ...defaultQueryOptions,
    staleTime: 0, // Always check fresh
  });
};

// Get location key suggestions
export interface SuggestLocationKeysResponse {
  suggestions: string[];
}

export interface SuggestLocationKeysRequest {
  locationName: string;
  companyId: string;
}

export const useSuggestLocationKeys = () => {
  return useMutation<SuggestLocationKeysResponse, Error, SuggestLocationKeysRequest>({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post('/operator/locations/suggest-keys', payload);
      return data.data;
    },
    retry: false,
  });
};