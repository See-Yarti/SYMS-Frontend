// Locations API Types
export interface Location {
  id: string;
  title: string;
  city: string;
  state: string;
  country: string;
  addressLine: string;
  longitude: string;
  latitude: string;
  isAirportZone: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationsResponse {
  data: {
    activeLocations: Location[];
    inactiveLocations: Location[];
  };
}

export interface LocationResponse {
  data: {
    location: Location;
  };
}

export interface CreateLocationRequest {
  title: string;
  city: string;
  state: string;
  country: string;
  addressLine: string;
  longitude: string;
  latitude: string;
  isAirportZone: boolean;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  isActive?: boolean;
}

export interface CheckLocationKeyResponse {
  data: {
    isAvailable: boolean;
  };
}

export interface SuggestLocationKeysResponse {
  data: {
    suggestions: string[];
  };
}
