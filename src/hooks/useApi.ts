import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation } from '@tanstack/react-query';

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

// Post Data Hook
export const usePostData = (endpoint: string) => {
  return useMutation({
    mutationFn: async (body: any) => {
      const { data } = await axiosInstance.post(endpoint, body);
      return data;
    },
  });
};
