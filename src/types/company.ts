// src/types/company.ts
export interface Company {
  id: string;
  logo: string | null;
  name: string;
  description: string;
  isVerified: boolean;
  biddingAllowedByAdmin?: boolean;
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
    total?: number;
    page?: number;
    limit?: number;
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

// --- add below your existing types ---

export type CommissionSource = 'BASE' | 'TIER' | 'OVERRIDE';
export type Tier = 'BASIC' | 'GOLD' | 'PREMIUM' | 'DIAMOND';

// Base interface for status commission settings
export interface StatusCommissionSetting {
  type: 'PERCENTAGE' | 'FIXED' | null;
  percentageRate?: number;
  fixedAmount?: number;
  splitPercentage?: number; // Only for LATE_CANCEL, NO_SHOW, CUSTOMER_FAULT when type is PERCENTAGE
  penaltyPercentage?: number; // Only for OPERATOR_FAULT
  yalaRidePercentage?: number; // Only for OPERATOR_FAULT (always 100)
}

export interface StatusCommissionSettingsPayload {
  COMPLETED?: StatusCommissionSetting;
  LATE_CANCEL?: StatusCommissionSetting;
  NO_SHOW?: StatusCommissionSetting;
  CUSTOMER_FAULT?: StatusCommissionSetting;
  OPERATOR_FAULT?: StatusCommissionSetting;
  FREE_CANCEL?: StatusCommissionSetting;
  PARTIAL_USE?: StatusCommissionSetting;
}

export interface SetStatusCommissionSettingsResponse {
  success: boolean;
  message: string;
  data: {
    companyId: string;
    baseCommissionRate: string;
    settings: CompanySettingsPayload;
  };
  timestamp: string;
}

export interface FixedCancellationAmountsPayload {
  useAllAmount?: number; // Global amount for all types
  lateCancel?: number; // Per-type amounts
  noShow?: number;
  customerFault?: number;
  partialUse?: number;
}

export interface SetFixedCancellationAmountsResponse {
  success: boolean;
  message: string;
  data: {
    companyId: string;
    baseCommissionRate: string;
    settings: CompanySettingsPayload;
  };
  timestamp: string;
}

export interface EdgeCaseHandlingPayload {
  edgeCaseHandling: 'CAP' | 'OWE';
}

export interface SetEdgeCaseHandlingResponse {
  success: boolean;
  message: string;
  data: {
    companyId: string;
    baseCommissionRate: string;
    settings: CompanySettingsPayload;
  };
  timestamp: string;
}

export interface CompanySettingsPayload {
  effectiveCommissionRate: string; // e.g. "10.00"
  commissionSource: CommissionSource;
  currentTier: Tier;
  subscriptionEndsAt: string | null; // ISO
  overrideCommissionRate: string | null; // e.g. "8.50"
  overrideEndsAt: string | null; // ISO
  statusCommissionSettings?: {
    COMPLETED?: StatusCommissionSetting | null;
    LATE_CANCEL?: StatusCommissionSetting | null;
    NO_SHOW?: StatusCommissionSetting | null;
    CUSTOMER_FAULT?: StatusCommissionSetting | null;
    OPERATOR_FAULT?: StatusCommissionSetting | null;
    FREE_CANCEL?: StatusCommissionSetting | null;
    PARTIAL_USE?: StatusCommissionSetting | null;
  };
  fixedCancellationAmount?: string | null;
  fixedCancellationAmountLateCancel?: string | null;
  fixedCancellationAmountNoShow?: string | null;
  fixedCancellationAmountCustomerFault?: string | null;
  fixedCancellationAmountPartialUse?: string | null;
  edgeCaseHandling?: 'CAP' | 'OWE';
}

export interface CompanySettingsResponse {
  success: boolean;
  data: {
    companyId: string;
    baseCommissionRate: string;
    settings: CompanySettingsPayload;
  };
  timestamp: string;
}

export interface PlanConfig {
  tier: Tier;
  durationDays: number;
  commissionDelta: string; // "0.00" | "1.00" | ...
  boostScore: number;
}

export interface PlanConfigsResponse {
  success: boolean;
  data: PlanConfig[];
  timestamp: string;
}

export type SubscriptionMode = 'startNow' | 'startAfterCurrent';

export interface StartSubscriptionBody {
  tier: Tier;
  days: number; // default 30, or custom
  mode: SubscriptionMode;
  note?: string;
}

export interface StartSubscriptionResponse {
  success: boolean;
  data: {
    message: string;
    data: {
      subscriptionId: string;
      startsAt: string;
      endsAt: string;
    };
  };
  timestamp: string;
}

export interface OverrideCommissionBody {
  rate: number; // 8.5
  endsAt: string; // ISO (UTC)
}

export interface GenericOk {
  success: boolean;
  data: unknown;
  timestamp: string;
}
