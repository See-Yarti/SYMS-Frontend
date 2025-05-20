import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import {
  CompaniesResponse,
  CompanyResponse,
  UnverifyCompanyPayload,
  VerificationResponse,
} from '@/types/company';

// Shared query optionse
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

// After a verify/unverify, always refresh companies & company details in cache!
export const useVerifyCompany = () => {
  return useMutation<VerificationResponse, Error, string>({
    mutationFn: async (companyId: string) => {
      const { data } = await axiosInstance.patch(
        `/company/company-verify/${companyId}`,
      );
      return data;
    },
    onSuccess: (_data, companyId) => {
      // Invalidate companies list and this specific company’s details
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
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
    onSuccess: (_data, variables) => {
      // Same here: update both the companies list and the specific company in the UI
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({
        queryKey: ['company', variables.companyId],
      });
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
