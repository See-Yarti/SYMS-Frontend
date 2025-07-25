// src/types/company.ts
export interface Company {
  id: string;
  logo: string | null;
  name: string;
  description: string;
  isVerified: boolean;
  unverifiedReason: string | null;
  unverifiedReasonDescription: string | null;
  unverifiedDate: string | null;
  taxNumber: string;
  taxFile: string | null;
  tradeLicenseFile: string | null;
  tradeLicenseIssueNumber: string;
  tradeLicenseExpiryDate: string;
  citiesOfOperation: string[];
  idProofFile: string | null;
  passportProofFile: string | null;
  utilityBillFile: string | null;
  createdAt: string;
  updatedAt: string;
  operators?: Operator[];
  addresses?: Address[];
}

export interface Operator {
  company: any;
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    avatar: string | null;
    isFirstLogin: boolean;
    phoneNumber: string;
    gender: string;
    lastActivityAt: string;
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
  };
  operatorRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  addressLabel: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  postalCode: string;
  lat: string;
  lng: string;
  additionalInfo: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompaniesResponse {
  success: boolean;
  data: {
    companies: Company[];
  };
  timestamp: string;
}

export interface CompanyResponse {
  success: boolean;
  data: {
    company: Company;
  };
  timestamp: string;
}

export interface UnverifyCompanyPayload {
  unverifiedReason: string;
  unverifiedReasonDescription: string;
}

export interface VerificationResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  errors?: Array<{
    field: string;
    constraints: string[];
  }>;
  timestamp: string;
}


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

export interface OperatorProfileFlat {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phoneNumber: string;
  gender: string;
  operatorRole: string;
  company: Company;
}