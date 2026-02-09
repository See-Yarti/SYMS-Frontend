// Accounting API Services
import { apiClient } from '../client';
import type {
  AccountingQueryParams,
  AccountingResponse,
  AccountingResultsResponse,
} from './accounting.types';

export const accountingApi = {
  // Get admin accounting data
  getAdminAccounting: async (
    params: AccountingQueryParams,
  ): Promise<AccountingResponse> => {
    const { data } = await apiClient.get('/accounting/admin', { params });
    return data;
  },

  // Get admin accounting results
  getAdminAccountingResults: async (
    params: AccountingQueryParams,
  ): Promise<AccountingResultsResponse> => {
    const { data } = await apiClient.get('/accounting/admin/results', {
      params,
    });
    return data;
  },

  // Get operator accounting data
  getOperatorAccounting: async (
    params: AccountingQueryParams,
  ): Promise<AccountingResponse> => {
    const { data } = await apiClient.get('/accounting/operator', { params });
    return data;
  },

  // Get operator accounting results
  getOperatorAccountingResults: async (
    params: AccountingQueryParams,
  ): Promise<AccountingResultsResponse> => {
    const { data } = await apiClient.get('/accounting/operator/results', {
      params,
    });
    return data;
  },
};
