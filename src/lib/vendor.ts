// src/lib/VendorTable.ts:
import { axiosInstance } from '@/lib/API';

export const fetchVendors = async (limit: number = 10, page: number = 1) => {
  const response = await axiosInstance.get('/vendor', { params: { limit, page } });
  return response.data;
};

export const fetchVendorById = async (id: string) => {
  const response = await axiosInstance.get(`/vendor/${id}`);
  return response.data;
};

export const verifyVendor = async (vendorId: string, newPassword: string) => {
  const response = await axiosInstance.post('/vendor/verify', { vendorId, newPassword });
  return response.data;
};

export const deleteVendor = async (id: string) => {
  const response = await axiosInstance.delete(`/vendor/${id}`);
  return response.data;
};