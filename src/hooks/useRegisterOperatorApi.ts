import { axiosInstance } from '@/lib/API';
import { useMutation } from '@tanstack/react-query';

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

// OTP Verification APIs
export const useSendOtp = () => {
  return useMutation<{ success: boolean }, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      const { data } = await axiosInstance.post('/auth/send-otp', { email });
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

      const { data } = await axiosInstance.post('/auth/verify-otp', formData);
      return data;
    },
    onError: (error) => {
      console.error('Error verifying OTP:', error);
    },
  });
};
