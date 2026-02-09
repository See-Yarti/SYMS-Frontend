// Rates API Services
import { apiClient } from '../client';
import type {
  RatesQueryParams,
  RatesResponse,
  CreateRateRequest,
  UpdateRateRequest,
  RateResponse,
  BlackoutRequest,
  BlackoutResponse,
  TaxRequest,
  TaxResponse,
  CDWRequest,
  CDWResponse,
} from './rates.types';

export const ratesApi = {
  // Get rates for location
  getRates: async (
    locationId: string,
    params?: RatesQueryParams,
  ): Promise<RatesResponse> => {
    const { data } = await apiClient.get(`/rate/location/${locationId}`, {
      params,
    });
    return data;
  },

  // Create rate
  createRate: async (
    locationId: string,
    rateData: CreateRateRequest,
  ): Promise<RateResponse> => {
    const { data } = await apiClient.post(
      `/rate/location/${locationId}`,
      rateData,
    );
    return data;
  },

  // Update rate
  updateRate: async (
    rateId: string,
    rateData: UpdateRateRequest,
  ): Promise<RateResponse> => {
    const { data } = await apiClient.put(`/rate/${rateId}`, rateData);
    return data;
  },

  // Delete rate
  deleteRate: async (rateId: string): Promise<void> => {
    await apiClient.delete(`/rate/${rateId}`);
  },

  // Blackouts
  getBlackouts: async (locationId: string): Promise<BlackoutResponse> => {
    const { data } = await apiClient.get(`/blackout/location/${locationId}`);
    return data;
  },

  createBlackout: async (
    locationId: string,
    blackoutData: BlackoutRequest,
  ): Promise<BlackoutResponse> => {
    const { data } = await apiClient.post(
      `/blackout/location/${locationId}`,
      blackoutData,
    );
    return data;
  },

  // Taxes
  getTaxes: async (locationId: string): Promise<TaxResponse> => {
    const { data } = await apiClient.get(`/tax/location/${locationId}`);
    return data;
  },

  createTax: async (
    locationId: string,
    taxData: TaxRequest,
  ): Promise<TaxResponse> => {
    const { data } = await apiClient.post(
      `/tax/location/${locationId}`,
      taxData,
    );
    return data;
  },

  // CDW (Collision Damage Waiver)
  getCDW: async (locationId: string): Promise<CDWResponse> => {
    const { data } = await apiClient.get(`/cdw/location/${locationId}`);
    return data;
  },

  createCDW: async (
    locationId: string,
    cdwData: CDWRequest,
  ): Promise<CDWResponse> => {
    const { data } = await apiClient.post(
      `/cdw/location/${locationId}`,
      cdwData,
    );
    return data;
  },
};
