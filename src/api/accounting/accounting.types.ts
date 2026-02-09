// Accounting API Types
export interface AccountingQueryParams {
  companyId?: string;
  locationId?: string | null;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AccountingItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  // Add other accounting fields
}

export interface AccountingResponse {
  data: {
    items: AccountingItem[];
    summary: {
      totalIncome: number;
      totalExpense: number;
      netAmount: number;
    };
  };
}

export interface AccountingResultsResponse {
  data: {
    results: AccountingItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
    };
  };
}
