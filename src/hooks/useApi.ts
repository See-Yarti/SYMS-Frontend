// src/hooks/useApi.ts
import { axiosInstance } from '@/lib/API';
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
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

export const useFetchData = <T = unknown>(
  endpoint: string,
  queryKey: string | string[],
  options?: any,
) => {
  return useQuery<T>({
    ...defaultQueryOptions,
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const { data } = await axiosInstance.get(endpoint);
      return data.data;
    },
    ...options,
  });
};

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
    ...defaultQueryOptions,
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


export const useDeleteData = (options?: any) => {
  return useMutation({
    mutationFn: async (endpoint: string) => {
      const { data } = await axiosInstance.delete(endpoint);
      return data.data;
    },
    ...options,
  });
};

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