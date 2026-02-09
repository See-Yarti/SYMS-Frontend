import { apiClient } from '@/api/client';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/app/providers';

// --- File Upload with Auto-Refresh ---
export const useUploadFile = <TResponse = unknown>(
  endpoint: string,
  invalidateKey?: string | string[],
) => {
  return useMutation<TResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      if (invalidateKey)
        queryClient.invalidateQueries({
          queryKey: Array.isArray(invalidateKey)
            ? invalidateKey
            : [invalidateKey],
        });
    },
    retry: false,
  });
};

// --- OTP Verification APIs ---
export const useSendOtp = () => {
  return useMutation<{ success: boolean }, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      const { data } = await apiClient.post('/auth/send-otp', { email });
      return data;
    },
    onError: (error) => {
      console.error('Error sending OTP:', error);
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation<
    { success: boolean },
    Error,
    { email: string; otp: string }
  >({
    mutationFn: async ({ email, otp }) => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);

      const { data } = await apiClient.post('/auth/verify-otp', formData);
      return data;
    },
    onError: (error) => {
      console.error('Error verifying OTP:', error);
    },
  });
};
