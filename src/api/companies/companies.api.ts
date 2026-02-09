// Companies API Services
import { apiClient } from '../client';
import type {
  CompaniesQueryParams,
  CompaniesResponse,
  CompanyResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  VerifyCompanyResponse,
  UnverifyCompanyRequest,
} from './companies.types';

export const companiesApi = {
  // Get all companies with filters
  getCompanies: async (
    params: CompaniesQueryParams,
  ): Promise<CompaniesResponse> => {
    const { data } = await apiClient.get('/company/companies', { params });
    return data;
  },

  // Get single company by ID
  getCompany: async (companyId: string): Promise<CompanyResponse> => {
    const { data } = await apiClient.get(`/company/${companyId}`);
    return data;
  },

  // Create company
  createCompany: async (
    companyData: CreateCompanyRequest,
  ): Promise<CompanyResponse> => {
    const { data } = await apiClient.post(
      '/company/company-register',
      companyData,
    );
    return data;
  },

  // Update company
  updateCompany: async (
    companyId: string,
    companyData: UpdateCompanyRequest,
  ): Promise<CompanyResponse> => {
    const { data } = await apiClient.put(`/company/${companyId}`, companyData);
    return data;
  },

  // Delete company
  deleteCompany: async (companyId: string): Promise<void> => {
    await apiClient.delete(`/company/${companyId}`);
  },

  // Verify company
  verifyCompany: async (companyId: string): Promise<VerifyCompanyResponse> => {
    const { data } = await apiClient.patch(
      `/company/company-verify/${companyId}`,
    );
    return data;
  },

  // Unverify company
  unverifyCompany: async (
    companyId: string,
    payload: UnverifyCompanyRequest,
  ): Promise<VerifyCompanyResponse> => {
    const { data } = await apiClient.patch(
      `/company/company-un-verify/${companyId}`,
      payload,
    );
    return data;
  },
};
