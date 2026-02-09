// Operators API Services
import { apiClient } from '../client';
import type {
  OperatorsQueryParams,
  OperatorsResponse,
  OperatorResponse,
  CreateOperatorRequest,
  UpdateOperatorRequest,
} from './operators.types';

export const operatorsApi = {
  // Get all operators
  getOperators: async (
    params: OperatorsQueryParams,
  ): Promise<OperatorsResponse> => {
    const { data } = await apiClient.get('/operator/operators', { params });
    return data;
  },

  // Get single operator
  getOperator: async (operatorId: string): Promise<OperatorResponse> => {
    const { data } = await apiClient.get(`/operator/${operatorId}`);
    return data;
  },

  // Create operator
  createOperator: async (
    operatorData: CreateOperatorRequest,
  ): Promise<OperatorResponse> => {
    const { data } = await apiClient.post('/operator/register', operatorData);
    return data;
  },

  // Update operator
  updateOperator: async (
    operatorId: string,
    operatorData: UpdateOperatorRequest,
  ): Promise<OperatorResponse> => {
    const { data } = await apiClient.put(
      `/operator/${operatorId}`,
      operatorData,
    );
    return data;
  },

  // Delete operator
  deleteOperator: async (operatorId: string): Promise<void> => {
    await apiClient.delete(`/operator/${operatorId}`);
  },
};
