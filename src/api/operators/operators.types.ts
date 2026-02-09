// Operators API Types
export interface OperatorsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorsResponse {
  data: {
    operators: Operator[];
    meta: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export interface OperatorResponse {
  data: {
    operator: Operator;
  };
}

export interface CreateOperatorRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  companyId: string;
}

export interface UpdateOperatorRequest extends Partial<CreateOperatorRequest> {
  // Update can be partial
}
