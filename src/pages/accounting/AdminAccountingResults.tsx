// src/pages/accounting/AdminAccountingResults.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyAccounting } from '@/hooks/useAccounting';
import { useGetCompanies } from '@/hooks/useCompanyApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  RefreshCw,
  Receipt,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { exportInvoiceToExcel } from '@/utils/excelExport';
import { AccountingItem, AccountingType } from '@/types/accounting';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import { toast } from 'sonner';
import { fetchInvoice, fetchInvoiceJson } from '@/hooks/useAccounting';

const typeStyles: Record<AccountingType, string> = {
  BOOKING_COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FREE_CANCEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LATE_CANCEL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CUSTOMER_FAULT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  OPERATOR_FAULT: 'bg-[#F56304]/10 text-[#F56304] dark:bg-[#F56304]/20 dark:text-[#F56304]',
  PARTIAL_USE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const AdminAccountingResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get params from URL
  const companyId = searchParams.get('companyId') || '';
  const locationId = searchParams.get('locationId') || null;
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Fetch companies to get company name
  const { data: companiesData } = useGetCompanies({ limit: 1000, page: 1, isVerified: true });
  const companies = companiesData?.data?.companies ?? [];
  const selectedCompany = companies.find((c: any) => c.id === companyId);

  // API params
  const companyAccountingParams = useMemo(() => {
    if (!companyId || !dateFrom || !dateTo) {
      return null;
    }
    return {
      companyId,
      locationId: locationId || null,
      dateFrom,
      dateTo,
      page,
      limit,
    };
  }, [companyId, locationId, dateFrom, dateTo, page, limit]);

  // Fetch accounting data
  const { data: companyData, isLoading: companyLoading, isError: companyError, refetch: companyRefetch } = useCompanyAccounting(
    companyAccountingParams || { companyId: '', dateFrom: '', dateTo: '' }
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    navigate(`/admin-accounting/results?${params.toString()}`, { replace: true });
  };

  const handleGenerateInvoice = async () => {
    if (!companyId || companyId === 'all') {
      toast.error('Please select a company');
      return;
    }

    if (!dateFrom || !dateTo) {
      toast.error('Please select date range (from and to dates are required)');
      return;
    }

    setInvoiceLoading(true);

    try {
      const locationIdParam = locationId && locationId !== 'all' ? locationId : null;
      // Fetch PDF directly from backend
      const invoiceResponse = await fetchInvoice(companyId, locationIdParam, {
        from: dateFrom,
        to: dateTo,
      });
      
      // Handle PDF response - fetchInvoice returns an object with download method for PDF
      if (invoiceResponse && typeof invoiceResponse === 'object' && 'download' in invoiceResponse && typeof (invoiceResponse as any).download === 'function') {
        // PDF blob with download method - call it to download
        (invoiceResponse as any).download();
        setInvoiceData(invoiceResponse); // Store for later use (for Download PDF button)
        toast.success('Invoice generated and downloaded successfully');
      } else if (invoiceResponse instanceof Blob) {
        // Direct blob response (fallback)
        const url = window.URL.createObjectURL(invoiceResponse);
        const link = document.createElement('a');
        link.href = url;
        link.download = locationIdParam
          ? `invoice-${companyId}-${locationIdParam}-${dateFrom}-${dateTo}.pdf`
          : `invoice-${companyId}-all-locations-${dateFrom}-${dateTo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice generated and downloaded successfully');
      } else {
        // If it's JSON data, store it
        setInvoiceData(invoiceResponse);
      toast.success('Invoice generated successfully');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate invoice';
      toast.error(errorMessage);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceData) {
      toast.error('Please generate invoice first');
      return;
    }

    try {
      const locationIdParam = locationId && locationId !== 'all' ? locationId : null;
      const blob = await fetchInvoice(companyId, locationIdParam, {
        from: dateFrom,
        to: dateTo,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${companyId}-${locationIdParam || 'all-locations'}-${dateFrom}-${dateTo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to download invoice';
      toast.error(errorMessage);
    }
  };

  const handleExportToExcel = async () => {
    if (!companyId || companyId === 'all') {
      toast.error('Please select a company');
      return;
    }

    try {
      const locationIdParam = locationId && locationId !== 'all' ? locationId : null;
      const jsonData = await fetchInvoiceJson(companyId, locationIdParam, {
        from: dateFrom,
        to: dateTo,
      });

      const filename = locationIdParam
        ? `invoice-${companyId}-${locationIdParam}-${dateFrom}-${dateTo}.xlsx`
        : `invoice-${companyId}-all-locations-${dateFrom}-${dateTo}.xlsx`;

      await exportInvoiceToExcel(jsonData, filename);
      toast.success('Excel file exported successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to export Excel file';
      toast.error(errorMessage);
    }
  };

  if (companyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Accounting Results</h1>
        </div>
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin-accounting')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Accounting Results</h1>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium">Unable to load accounting data</span>
          </div>
          <p className="text-sm mb-4">
            An unexpected error occurred while fetching accounting data.
          </p>
          <Button onClick={() => companyRefetch()} variant="destructive">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const accountingData = companyData?.data;
  const items = accountingData?.items || [];
  const summary = accountingData?.summary;
  const meta = accountingData;
  const totalPages = Math.ceil((meta?.total || 0) / limit);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin-accounting')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Accounting Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedCompany?.name && `Company: ${selectedCompany.name}`}
            {locationId && ` • Location: ${locationId}`}
            {` • ${formatDate(dateFrom)} - ${formatDate(dateTo)}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerateInvoice}
            disabled={!companyId || companyId === 'all' || invoiceLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {invoiceLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Generate Invoice
              </>
            )}
          </Button>


          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={!companyId || companyId === 'all'}
            className="border-gray-300 bg-white dark:text-black"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Refund</p>
                  <p className="text-2xl font-bold">{summary.totalRefund || '0.00'}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Payout</p>
                  <p className="text-2xl font-bold">{summary.totalPayout || '0.00'}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold">{summary.totalCommission || '0.00'}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Owes</p>
                  <p className="text-2xl font-bold">{summary.totalOwes || '0.00'}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{summary.totalRecords || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <RefreshCw className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Status</TableHead>
                  <TableHead>Pickup Date</TableHead>
                  <TableHead>Drop Date</TableHead>
                  <TableHead className="text-right">Customer Refund</TableHead>
                  <TableHead className="text-right">Operator Payout</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No accounting records found for the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: AccountingItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.bookingid}</TableCell>
                      <TableCell>
                        <Badge className={typeStyles[item.type] || ''}>
                          {item.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.paidstatus}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.pickupat)}</TableCell>
                      <TableCell>{formatDate(item.dropat)}</TableCell>
                      <TableCell className="text-right">{item.customerrefund || '0.00'}</TableCell>
                      <TableCell className="text-right">{item.operatorpayout || '0.00'}</TableCell>
                      <TableCell className="text-right">{item.yellacommission || '0.00'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {page} of {totalPages} (Total: {meta?.total || 0} records)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccountingResults;

