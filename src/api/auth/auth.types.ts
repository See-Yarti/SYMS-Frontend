// Authentication API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  // Add other registration fields
}

export interface LoginResponse {
  data: {
    tokens: {
      _aT: string;
      _rT: string;
    };
    user: {
      id: string;
      email: string;
      role: string;
      // Add other user fields
    };
  };
}

export interface RegisterResponse {
  data: {
    message: string;
    user: any;
  };
}
