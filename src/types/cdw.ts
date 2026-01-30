// src/types/cdw.ts

/**
 * Company-level CDW Settings (Admin)
 * Retrieved from GET /company-settings/:companyId
 */
export interface CompanyCDWSettings {
  cdwEnabled: boolean;
  cdwMinPercentage: string;
  cdwMaxPercentage: string;
  cdwCommissionPercentage: string;
  cdwTaxOnCdwAllowed: boolean;
}

/**
 * Payload for updating company CDW settings (Admin only)
 * POST /company-settings/:companyId/cdw-settings
 */
export interface UpdateCompanyCDWPayload {
  cdwEnabled: boolean;
  cdwMinPercentage?: number;
  cdwMaxPercentage?: number;
  cdwCommissionPercentage?: number;
}

/**
 * Car class CDW percentage for per-class scope
 */
export interface CarClassCDWPercentage {
  companyCarClassId: string;
  cdwPercentage: number;
}

/**
 * Location-level CDW Settings
 * Retrieved from GET /operator/locations/cdw-settings/:locationId
 */
export interface LocationCDWSettings {
  locationId: string;
  cdwEnabled: boolean;
  scope: 'WHOLE_LOCATION' | 'PER_CAR_CLASS' | null;
  cdwOption: 'PART_OF_RENTAL' | 'SEPARATE' | null;
  cdwPercentage: string | null;
  carClassPercentages: CarClassCDWPercentage[] | null;
  cdwTaxApplicable: boolean;
  cdwTaxType: 'PERCENTAGE' | 'FIXED' | null;
  cdwTaxValue: string | null;
  revenueCalculationMethod: 'PART_OF_RENTAL' | 'SEPARATE';
  taxOnCdwEnabled: boolean;
  adminCdwEnabled: boolean;
  adminCdwMinPercentage: string;
  adminCdwMaxPercentage: string;
  cdwTaxOnCdwAllowed: boolean;
}

/**
 * Payload for updating location CDW settings (simple/legacy)
 * PUT /operator/locations/cdw-settings/:locationId
 */
export interface UpdateLocationCDWPayload {
  cdwEnabled: boolean;
  cdwOption?: 'PART_OF_RENTAL' | 'SEPARATE';
  cdwPercentage?: number;
  cdwTaxApplicable?: boolean;
  cdwTaxType?: 'PERCENTAGE' | 'FIXED';
  cdwTaxValue?: number;
}

/**
 * Payload for full location CDW settings (recommended)
 * PUT /operator/locations/cdw-settings/:locationId/full
 */
export interface UpdateLocationCDWFullPayload {
  cdwEnabled: boolean;
  scope?: 'WHOLE_LOCATION' | 'PER_CAR_CLASS';
  wholeLocationPercentage?: number;
  carClassPercentages?: CarClassCDWPercentage[];
  revenueCalculationMethod?: 'PART_OF_RENTAL' | 'SEPARATE';
  taxOnCdwEnabled?: boolean;
  taxOnCdwType?: 'PERCENTAGE' | 'FIXED';
  taxOnCdwValue?: number;
}

/**
 * API Response wrapper
 */
export interface CDWApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Company settings response (includes CDW)
 */
export interface CompanySettingsResponse {
  companyId: string;
  baseCommissionPercentage: string;
  settings: {
    commissionType: string;
    effectiveCommissionPercentage: string;
    fixedCommissionAmount: string | null;
    commissionDisplay: string;
    statusCommissionSettings: any;
    edgeCaseHandling: string;
    cdw: CompanyCDWSettings;
  };
}
