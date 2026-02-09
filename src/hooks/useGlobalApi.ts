// ============================================
// GLOBAL API HOOKS - Single source of truth
// ============================================
'use client';

import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { queryClient } from '@/app/providers';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

// ============================================
// 1. GET Hook - For all GET requests
// ============================================
export function useApiGet<TData = any>(
  queryKey: any[],
  url: string,
  params?: Record<string, any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    select?: (data: any) => TData;
  }
) {
  return useQuery<TData>({
    queryKey: params ? [...queryKey, params] : queryKey,
    queryFn: async () => {
      const { data } = await apiClient.get(url, { params });
      return options?.select ? options.select(data) : data;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

// ============================================
// 2. POST/PUT/PATCH Hook - For mutations
// ============================================
export function useApiMutate<TData = any, TVariables = any>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  getUrl: string | ((vars: TVariables) => string),
  options?: {
    successMessage?: string;
    invalidateKeys?: string[][];
    onSuccess?: (data: TData, vars: TVariables) => void;
  }
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const url = typeof getUrl === 'function' ? getUrl(variables) : getUrl;
      
      let response;
      if (method === 'POST') response = await apiClient.post(url, variables);
      else if (method === 'PUT') response = await apiClient.put(url, variables);
      else if (method === 'PATCH') response = await apiClient.patch(url, variables);
      else response = await apiClient.delete(url, { data: variables });
      
      return response.data;
    },
    onSuccess: (data, vars) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      if (options?.successMessage) toast.success(options.successMessage);
      if (options?.onSuccess) options.onSuccess(data, vars);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Operation failed');
    },
  });
}

// ============================================
// 3. Paginated GET - For lists with pagination
// ============================================
export function usePaginatedGet<TData = any>(
  queryKey: any[],
  url: string,
  params?: Record<string, any>
) {
  return useQuery<TData>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const { data } = await apiClient.get(url, { params });
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}
