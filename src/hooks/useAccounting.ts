// src/hooks/useAccounting.ts
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/API';
import { AccountingResponse } from '@/types/accounting';

interface AccountingParams {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  locationId?: string | null;
}

// Admin accounting hook
export const useAdminAccounting = (params: AccountingParams) => {
  return useQuery<AccountingResponse>({
    queryKey: ['admin-accounting', params],
    queryFn: async () => {
      // Use URLSearchParams for proper encoding like other hooks
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.page && params.page > 1) searchParams.append('page', String(params.page));
      if (params.limit && params.limit !== 20) searchParams.append('limit', String(params.limit));

      const queryString = searchParams.toString();
      const fullUrl = queryString ? `accounting/admin?${queryString}` : 'accounting/admin';

      const { data } = await axiosInstance.get(fullUrl);
      return data;
    },
    enabled: !!(params.dateFrom && params.dateTo),
  });
};

// Operator accounting hook - uses location-specific endpoint when locationId is provided
export const useOperatorAccounting = (companyId: string, params: AccountingParams) => {
  return useQuery<AccountingResponse>({
    queryKey: ['operator-accounting', companyId, params.locationId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.page && params.page > 1) searchParams.append('page', String(params.page));
      if (params.limit && params.limit !== 20) searchParams.append('limit', String(params.limit));

      const queryString = searchParams.toString();

      // When locationId is provided, use location-specific endpoint to get that location's data only
      const endpoint = params.locationId && params.locationId !== 'all'
        ? `accounting/company/${companyId}/location/${params.locationId}${queryString ? `?${queryString}` : ''}`
        : `accounting/company/${companyId}${queryString ? `?${queryString}` : ''}`;

      const { data } = await axiosInstance.get(endpoint);
      return data;
    },
    enabled: !!(companyId && params.dateFrom && params.dateTo),
  });
};

// Admin company accounting hook (for admin - can be used for all locations or single location)
interface CompanyAccountingParams extends AccountingParams {
  companyId: string;
  locationId?: string | null;
}

export const useCompanyAccounting = (params: CompanyAccountingParams) => {
  return useQuery<AccountingResponse>({
    queryKey: ['company-accounting', params.companyId, params.locationId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.page && params.page > 1) searchParams.append('page', String(params.page));
      if (params.limit && params.limit !== 20) searchParams.append('limit', String(params.limit));

      const queryString = searchParams.toString();
      
      // For admin: Use admin company endpoint for all locations, or location endpoint for single location
      const endpoint = params.locationId
        ? `accounting/company/${params.companyId}/location/${params.locationId}${queryString ? `?${queryString}` : ''}`
        : `accounting/admin/company/${params.companyId}${queryString ? `?${queryString}` : ''}`;

      const { data } = await axiosInstance.get(endpoint);
      return data;
    },
    enabled: !!(params.companyId && params.dateFrom && params.dateTo),
  });
};

// Invoice API function
interface InvoiceParams {
  from?: string;
  to?: string;
}

export const fetchInvoice = async (
  companyId: string,
  operationalLocationId: string | null,
  params: InvoiceParams
) => {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  if (!params.from || !params.to) {
    throw new Error('Date range (from and to) is required');
  }

  const searchParams = new URLSearchParams();
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  const queryString = searchParams.toString();
  
  // Use multi-location endpoint if no location is provided, otherwise use single location endpoint
  const endpoint = operationalLocationId
    ? `accounting/invoice/${companyId}/${operationalLocationId}/pdf${queryString ? `?${queryString}` : ''}`
    : `accounting/invoice/multi-location/${companyId}/pdf${queryString ? `?${queryString}` : ''}`;

  try {
    // Request PDF as blob
    const response = await axiosInstance.get(endpoint, {
      responseType: 'blob',
      validateStatus: () => true, // Allow all status codes to handle errors manually
    });

    // Check status code first
    if (response.status >= 400) {
      // Error response - try to parse as JSON from blob
      let errorText = '';
      let errorJson: any = null;
      
      try {
        // Read blob as text only once
        errorText = await (response.data as Blob).text();
        // Try to parse as JSON
        errorJson = JSON.parse(errorText);
      } catch {
        // If JSON parsing fails, use text as is
        console.log('Error parsing JSON, using text:', errorText);
      }
      
      // Extract error message
      const errorMessage = errorJson?.message || errorJson?.error || errorText || `Server returned error status ${response.status}`;
      
      // Create error with proper structure
      const error = new Error(errorMessage);
      (error as any).response = {
        status: response.status,
        data: errorJson || { message: errorText || errorMessage },
      };
      
      throw error;
    }

    // Check if response is actually a PDF (check content-type)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/pdf')) {
      // Return blob URL for download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      return {
        blob,
        url,
        type: 'pdf',
        download: () => {
          const link = document.createElement('a');
          link.href = url;
          link.download = operationalLocationId
            ? `invoice-${companyId}-${operationalLocationId}-${params.from}-${params.to}.pdf`
            : `invoice-${companyId}-all-locations-${params.from}-${params.to}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      };
    }

    // If not PDF, try to parse as JSON (might be error response)
    if (response.data instanceof Blob) {
      try {
        const text = await response.data.text();
        const jsonData = JSON.parse(text);
        return jsonData;
      } catch {
        return response.data;
      }
    }

    return response.data;
  } catch (error: any) {
    // If error was already thrown from the try block with proper formatting, re-throw it
    if (error?.response || error?.message) {
      throw error;
    }

    // Handle unexpected errors (network, etc.)
    throw new Error(error?.message || 'Failed to generate invoice. Please try again.');
  }
};

// Fetch invoice JSON data for Excel export
export const fetchInvoiceJson = async (
  companyId: string,
  operationalLocationId: string | null,
  params: InvoiceParams
) => {
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  if (!params.from || !params.to) {
    throw new Error('Date range (from and to) is required');
  }

  const searchParams = new URLSearchParams();
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);

  const queryString = searchParams.toString();
  
  // Use multi-location endpoint if no location is provided, otherwise use single location endpoint
  const endpoint = operationalLocationId
    ? `accounting/invoice/${companyId}/${operationalLocationId}/json${queryString ? `?${queryString}` : ''}`
    : `accounting/invoice/multi-location/${companyId}/json${queryString ? `?${queryString}` : ''}`;

  try {
    const { data } = await axiosInstance.get(endpoint);
    return data;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch invoice data';
    throw new Error(errorMessage);
  }
};
