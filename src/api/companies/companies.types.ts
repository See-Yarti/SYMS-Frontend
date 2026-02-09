// Companies API Types
export interface CompaniesQueryParams {
  search?: string;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiryDate: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Add other company fields
}

export interface CompaniesResponse {
  data: {
    companies: Company[];
    meta: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export interface CompanyResponse {
  data: {
    company: Company;
  };
}

export interface CreateCompanyRequest {
  name: string;
  description: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiryDate: string;
  // Add other fields
}

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  // Update can be partial
}

export interface VerifyCompanyResponse {
  data: {
    message: string;
    company: Company;
  };
}

export interface UnverifyCompanyRequest {
  reason: string;
}
