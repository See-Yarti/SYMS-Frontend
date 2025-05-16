// src/hooks/useApi.ts
import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation, useInfiniteQuery, QueryClient } from '@tanstack/react-query';
import {
  CompaniesResponse,
  CompanyResponse,
  UnverifyCompanyPayload,
  VerificationResponse,
} from '@/types/company';
import { useAppSelector } from '@/store';
import { selectCompanyId } from '@/store/features/auth.slice';

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
  options?: any
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
    },    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage)) return undefined;
      return lastPage.length === limit ? allPages.length + 1 : undefined;
    },  });
};

export const usePostData = <TData = unknown, TResponse = unknown>(
  endpoint: string,
  options?: any
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


export const useDeleteVendor = () => {
  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { data } = await axiosInstance.delete(`/vendor/${vendorId}`);
      return data;
    },
    retry: false,
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

// Types based on API responses
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phoneNumber: string;
  gender: string;
  isFirstLogin: boolean;
  lastActivityAt: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Operator = {
  company: any;
  id: string;
  user: User;
  operatorRole: string;
  createdAt: string;
  updatedAt: string;
};

export type Company = {
  id: string;
  logo: string | null;
  name: string;
  description: string;
  isVerified: boolean;
  taxNumber: string;
  taxFile: string;
  tradeLicenseFile: string;
  tradeLicenseIssueNumber: string;
  tradeLicenseExpiryDate: string;
  citiesOfOperation: string[];
  createdAt: string;
  updatedAt: string;
};

export type OperatorWithCompany = Operator & {
  company: Company;
};

export type AddOperatorPayload = {
  operatorName: string;
  operatorEmail: string;
  password: string;
  phoneNumber: string;
  operatorRole: string;
};

export type UpdateOperatorPayload = {
  name?: string;
  avatar?: File;
  phoneNumber?: string;
  gender?: string;
};

// Operator API hooks
export const useGetAllOperators = () => {
  const { user, companyId } = useAppSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';

  return useQuery<Operator[]>({
    ...defaultQueryOptions,
    enabled: Boolean(isAdmin || companyId),               // only run when we know who you are
    queryKey: ['operators', isAdmin ? 'all' : companyId], // distinct cache for admin vs. company
    queryFn: async () => {
      const endpoint = isAdmin
        ? '/operator/get-all'
        : `/operator/get-all/${companyId}`;                // always a real UUID now
      const { data } = await axiosInstance.get(endpoint);
      return data.data.data.operators;
    },
  });
};





export const useGetCompanyOperators = (companyId: string) => {
  return useQuery<Operator[]>({
    ...defaultQueryOptions,
    queryKey: ['company-operators', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/operator/get-all/${companyId}`,
      );
      return data.data.data.operators;
    },
    enabled: !!companyId,
  });
};

export const useGetOperator = (operatorId: string) => {
  return useQuery<OperatorWithCompany>({
    ...defaultQueryOptions,
    queryKey: ['operator', operatorId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/operator/${operatorId}`);
      return data.data.data.operator;
    },
    enabled: !!operatorId,
  });
};

export const useAddOperator = () => {
  const companyId = useAppSelector(selectCompanyId);
  console.log("this is company ID" , companyId);
  
  return useMutation<Operator, Error, AddOperatorPayload>({
    mutationFn: async (payload) => {
      if (!companyId) {
        throw new Error('Company ID is required to add an operator');
      }
      const { data } = await axiosInstance.patch(
        `/operator/add-new-operator/${companyId}`,
        payload
      );
      return data.data.data.operator;
    },
    onError: (err) => {
      console.error('AddOperator failed:', err.message);
    }
  });
};



export const useUpdateOperator = () => {
  return useMutation<
    Operator,
    Error,
    { operatorId: string; payload: UpdateOperatorPayload }
  >({
    mutationFn: async ({ payload }) => {
      const formData = new FormData();
      if (payload.name) formData.append('name', payload.name);
      if (payload.avatar) formData.append('avatar', payload.avatar);
      if (payload.phoneNumber)
        formData.append('phoneNumber', payload.phoneNumber);
      if (payload.gender) formData.append('gender', payload.gender);

      const { data } = await axiosInstance.patch(`/operator/update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data.data.operator;
    },
  });
};

export const useDeleteOperator = () => {
  const { companyId } = useAppSelector(state => state.auth);
  return useMutation({
    mutationFn: async (operatorId: string) => {
      await axiosInstance.delete(`/operator/${companyId}/${operatorId}`);
    },
  });
};

// Add to useApi.ts

// Change operator role
export const useChangeOperatorRole = () => {
  return useMutation<
    Operator, 
    Error, 
    { operatorId: string; operatorRole: string; companyId: string }
  >({
    mutationFn: async ({ operatorId, operatorRole, companyId }) => {
      const { data } = await axiosInstance.patch(
        `/operator/change-operator-role/${operatorId}`,
        { operatorRole, companyId }
      );
      return data.data.data.operator;
    },
    onError: (err) => {
      console.error('Change role failed:', err.message);
    }
  });
};

// Update operator password
export const useUpdateOperatorPassword = () => {
  return useMutation<
    { success: boolean },
    Error,
    { previousPassword: string; newPassword: string }
  >({
    mutationFn: async ({ previousPassword, newPassword }) => {
      const { data } = await axiosInstance.patch(
        '/operator/update-operator-password',
        { previousPassword, newPassword }
      );
      return data.data;
    },
    onError: (err) => {
      console.error('Password update failed:', err.message);
    }
  });
};

