import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation, QueryClient} from '@tanstack/react-query';
import {
    CompaniesResponse,
  CompanyResponse,
  UnverifyCompanyPayload,
  VerificationResponse,
} from '@/types/company';

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

export const useVerifyCompany = () => {
  return useMutation<VerificationResponse, Error, string>({
    mutationFn: async (companyId: string) => {
      const { data } = await axiosInstance.patch(
        `/company/company-verify/${companyId}`,
      );
      return data;
    },
    retry: false,
  });
};


export const useUnverifyCompany = () => {
  return useMutation<
    VerificationResponse,
    Error,
    { companyId: string; payload: UnverifyCompanyPayload }
  >({
    mutationFn: async ({ companyId, payload }) => {
      const { data } = await axiosInstance.patch(
        `/company/company-un-verify/${companyId}`,
        payload,
      );
      return data;
    },
    retry: false,
  });
};


export const useGetCompany = (companyId: string) => {
  return useQuery<CompanyResponse, Error>({
    ...defaultQueryOptions,
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/company/${companyId}`);
      return data;
    },
    enabled: !!companyId,
  });
};


export const useGetCompanies = () => {
  return useQuery<CompaniesResponse, Error>({
    ...defaultQueryOptions,
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/company');
      return data;
    },
  });
};