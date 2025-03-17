import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';

export const useFetchData = (endpoint: string, queryKey: string) => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await axiosInstance.get(endpoint);
      return data;
    },
    retry: false, // Prevent React Query from retrying on its own (Axios handles it)
  });
};

interface InfiniteQueryOptions {
  queryKey: string;
  endpoint: string;
  limit?: number;
  extraParams?: Record<string, any>;
  pageParamKey?: string; // Customizable page parameter key (e.g., 'cursor')
  limitParamKey?: string; // Customizable limit key (e.g., 'per_page')
}

// Get Data Hook with Pagination
export const useFetchInfiniteData = ({
  queryKey,
  endpoint,
  limit = 10,
  extraParams = {},
}: InfiniteQueryOptions) => {
  return useInfiniteQuery({
    queryKey: [queryKey, extraParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axiosInstance.get(endpoint, {
        params: { page: pageParam, limit, ...extraParams },
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // return lastPage?.hasNextPage ? allPages.length + 1 : undefined;
      if (lastPage.length === 0) {
        return undefined;
      }
      return allPages.length + 1;
    },
    retry: false,
  });
};
// Post Data Hook
export const usePostData = (endpoint: string) => {
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await axiosInstance.post(endpoint, body);
      return data;
    },
  });
};
