import { axiosInstance } from '@/lib/API';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store';
import { AddOperatorPayload, Operator, UpdateOperatorPayload } from '@/types/company';
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

// Operator API hooks
export const useGetAllOperators = (search?: string, operatorRole?: string) => {
  const { user, companyId } = useAppSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';

  return useQuery<Operator[]>({
    ...defaultQueryOptions,
    enabled: Boolean(isAdmin || companyId),
    queryKey: ['operators', isAdmin ? 'all' : companyId, search, operatorRole],
    queryFn: async () => {
      const endpoint = isAdmin
        ? '/operator/get-all'
        : `/operator/get-all/${companyId}`;
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (operatorRole) params.append('operatorRole', operatorRole);

      const { data } = await axiosInstance.get(`${endpoint}?${params.toString()}`);
      return data.data.data.operators;
    },
  });
};

export const useDeleteOperator = () => {
  const { companyId } = useAppSelector(state => state.auth);
  return useMutation({
    mutationFn: async (operatorId: string) => {
      await axiosInstance.delete(`/operator/${companyId}/${operatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
};



export const useAddOperator = () => {
  const companyId = useAppSelector(selectCompanyId);

  return useMutation<Operator, Error, AddOperatorPayload>({
    mutationFn: async (payload) => {
      if (!companyId) throw new Error('Company ID is required to add an operator');
      const { data } = await axiosInstance.patch(
        `/operator/add-new-operator/${companyId}`,
        payload
      );
      return data.data.data.operator;
    },
    onSuccess: () => {
      // Invalidate operator list query so it refetches the updated data
      queryClient.invalidateQueries({ queryKey: ['operators'] });
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
      if (payload.phoneNumber) formData.append('phoneNumber', payload.phoneNumber);
      if (payload.gender) formData.append('gender', payload.gender);

      const { data } = await axiosInstance.patch(`/operator/update`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data.data.operator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    }
  });
};



// Update operator password --> Profile Page
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