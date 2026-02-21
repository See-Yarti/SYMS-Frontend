// src/hooks/useOperatorCarClass.tsx:

import { apiClient } from '@/api/client';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryClient } from '@/app/providers';

// Helper function to convert object to FormData
const toFormData = (data: any) => {
  const formData = new FormData();
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }
  return formData;
};

// Fetch data (simple GET)
export const useFetchData = <T = unknown,>(
  endpoint: string,
  queryKey: string | string[],
  options?: any,
) => {
  return useQuery<T>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoint);
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

export const useFetchInfiniteData = <T = unknown,>({
  queryKey,
  endpoint,
  limit = 10,
  extraParams = {},
}: InfiniteQueryOptions) => {
  return useInfiniteQuery<T[]>({
    queryKey: [queryKey, extraParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<{ data: T[] }>(endpoint, {
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

// POST with FormData support
export const usePostData = <TData = unknown, TResponse = unknown>(
  endpoint: string,
  options?: any,
) => {
  return useMutation<TResponse, Error, TData>({
    mutationFn: async (data: TData) => {
      try {
        const formData = toFormData(data);
        const { data: responseData } = await apiClient.post(
          endpoint,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        return responseData.data;
      } catch (err: any) {
        // Re-throw a plain Error so 4xx are handled by onError without showing Axios stack in console/overlay
        const raw = err?.response?.data?.message;
        const msg =
          (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : null) ??
          err?.message ??
          'Request failed';
        const e = new Error(msg) as Error & { response?: any };
        e.response = err?.response;
        throw e;
      }
    },
    ...options,
  });
};

// PATCH with FormData support
export const usePatchData = <TData = unknown, TResponse = unknown>(
  endpoint: string,
  options?: any,
) => {
  return useMutation<TResponse, Error, TData>({
    mutationFn: async (data: TData) => {
      const formData = toFormData(data);
      const { data: responseData } = await apiClient.patch(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return responseData.data;
    },
    ...options,
  });
};

// PUT with FormData support
export const usePutData = <TData = unknown, TResponse = unknown>(
  options?: any,
) => {
  return useMutation<TResponse, Error, { endpoint: string; data?: TData }>({
    mutationFn: async ({ endpoint, data }) => {
      const formData = data ? toFormData(data) : new FormData();
      const { data: responseData } = await apiClient.put(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return responseData.data;
    },
    ...options,
  });
};

// DELETE
export const useDeleteData = (options?: any) => {
  return useMutation<any, Error, { endpoint: string }>({
    mutationFn: async ({ endpoint }) => {
      const { data } = await apiClient.delete(endpoint);
      return data.data;
    },
    ...options,
  });
};

// File Upload (POST)
export const useUploadFile = <TResponse = unknown,>(endpoint: string) => {
  return useMutation<TResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    retry: false,
  });
};

export const usePostJson = <TData = unknown, TResponse = unknown>(
  endpoint: string,
  options?: any,
) => {
  return useMutation<TResponse, any, TData>({
    mutationFn: async (data: TData) => {
      try {
        const { data: response } = await apiClient.post(endpoint, data, {
          headers: { 'Content-Type': 'application/json' },
        });
        return response.data; // assuming your API wraps as { success, data }
      } catch (err: any) {
        const raw = err?.response?.data?.message;
        const msg =
          (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : null) ??
          err?.message ??
          'Request failed';
        const e = new Error(msg) as Error & { response?: any };
        e.response = err?.response;
        throw e;
      }
    },
    ...options,
  });
};

type PatchVars = {
  endpoint: string; // e.g. 'blackout/:companyId/:blackoutId'
  data: any; // your payload (JSON)
};

export const usePatchDataBlackout = <TResponse = unknown,>(options?: any) => {
  return useMutation<TResponse, any, PatchVars>({
    mutationFn: async ({ endpoint, data }: PatchVars) => {
      const res = await apiClient.patch(endpoint, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      // adjust if your API shape is different
      return res.data?.data ?? res.data;
    },
    ...options,
  });
};

// Generic JSON PATCH (reusable beyond blackout)
type PatchJsonVars = {
  endpoint: string; // e.g. 'company-car-class-rate/:id'
  data: any; // JSON payload
};
export const usePatchJson = <TResponse = unknown,>(options?: any) => {
  return useMutation<TResponse, any, PatchJsonVars>({
    mutationFn: async ({ endpoint, data }: PatchJsonVars) => {
      const res = await apiClient.patch(endpoint, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data?.data ?? res.data;
    },
    ...options,
  });
};
