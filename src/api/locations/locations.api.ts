// Locations API Services
import { apiClient } from '../client';
import type {
  LocationsResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationResponse,
  CheckLocationKeyResponse,
  SuggestLocationKeysResponse,
} from './locations.types';

export const locationsApi = {
  // Get all locations for a company
  getLocations: async (companyId: string): Promise<LocationsResponse> => {
    const { data } = await apiClient.get(`/location/company/${companyId}`);
    return data;
  },

  // Create location
  createLocation: async (
    companyId: string,
    locationData: CreateLocationRequest,
  ): Promise<LocationResponse> => {
    const { data } = await apiClient.post(
      `/location/company/${companyId}`,
      locationData,
    );
    return data;
  },

  // Update location
  updateLocation: async (
    locationId: string,
    locationData: UpdateLocationRequest,
  ): Promise<LocationResponse> => {
    const { data } = await apiClient.put(
      `/location/${locationId}`,
      locationData,
    );
    return data;
  },

  // Toggle location status
  toggleLocation: async (locationId: string): Promise<LocationResponse> => {
    const { data } = await apiClient.patch(`/location/toggle/${locationId}`);
    return data;
  },

  // Check if location key is unique
  checkLocationKey: async (
    companyId: string,
    key: string,
  ): Promise<CheckLocationKeyResponse> => {
    const { data } = await apiClient.get(
      `/location/check-key/${companyId}/${key}`,
    );
    return data;
  },

  // Get suggested location keys
  suggestLocationKeys: async (
    companyId: string,
    title: string,
  ): Promise<SuggestLocationKeysResponse> => {
    const { data } = await apiClient.get(
      `/location/suggest-keys/${companyId}`,
      {
        params: { title },
      },
    );
    return data;
  },
};
