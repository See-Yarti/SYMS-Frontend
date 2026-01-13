// src/hooks/useApi.ts
import { axiosInstance } from '@/lib/API';
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { queryClient } from '@/Provider';

// Fetch data (simple GET)
export const useFetchData = <T = unknown>(
  endpoint: string,
  queryKey: string | string[],
  options?: any,
) => {
  return useQuery<T>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const { data } = await axiosInstance.get(endpoint);
      return data.data;
    },
    ...options,
  });
};

// Infinite GET (pagination)
interface InfiniteQueryOptions {
  queryKey: string;
  endpoint: string;
  limit?: number;
  extraParams?: Record<string, any>;
  pageParamKey?: string;
  limitParamKey?: string;
}

export const useFetchInfiniteData = <T = unknown>({
  queryKey,
  endpoint,
  limit = 10,
  extraParams = {},
}: InfiniteQueryOptions) => {
  return useInfiniteQuery<T[]>({
    queryKey: [queryKey, extraParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axiosInstance.get<{ data: T[] }>(endpoint, {
        params: { page: pageParam, limit, ...extraParams },
      });
      return data.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage)) return undefined;
      return lastPage.length === limit ? allPages.length + 1 : undefined;
    },
  });
};

// POST
export const usePostData = <TData = unknown, TResponse = unknown>(
  endpoint: string,
  options?: any,
) => {
  return useMutation<TResponse, Error, TData>({
    mutationFn: async (data: TData) => {
      const { data: responseData } = await axiosInstance.post(endpoint, data);
      return responseData.data;
    },
    ...options,
  });
};

// PATCH
export const usePatchData = <TData = unknown, TResponse = unknown>(
  endpoint: string,
  options?: any,
) => {
  return useMutation<TResponse, Error, TData>({
    mutationFn: async (data: TData) => {
      const { data: responseData } = await axiosInstance.patch(endpoint, data);
      return responseData.data;
    },
    ...options,
  });
};

// PUT (supports dynamic endpoint for toggling, etc.)
export const usePutData = <TData = unknown, TResponse = unknown>(
  options?: any,
) => {
  return useMutation<TResponse, Error, { endpoint: string; data?: TData }>({
    mutationFn: async ({ endpoint, data }) => {
      const { data: responseData } = await axiosInstance.put(endpoint, data);
      return responseData.data;
    },
    ...options,
  });
};

// DELETE (supports dynamic endpoint)
export const useDeleteData = (options?: any) => {
  return useMutation<any, Error, { endpoint: string }>({
    mutationFn: async ({ endpoint }) => {
      const { data } = await axiosInstance.delete(endpoint);
      return data.data;
    },
    ...options,
  });
};

// File Upload (POST)
export const useUploadFile = <TResponse = unknown>(endpoint: string) => {
  return useMutation<TResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data } = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    retry: false,
  });
};
