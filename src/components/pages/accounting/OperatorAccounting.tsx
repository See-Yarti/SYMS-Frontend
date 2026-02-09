'use client';

// src/pages/accounting/OperatorAccounting.tsx
import React, { useState } from 'react';
import { useNavigate } from '@/hooks/useNextNavigation';
import { useAppSelector } from '@/store';
import {
  useOperatorAccounting,
  fetchInvoice,
  fetchInvoiceJson,
} from '@/hooks/useAccounting';
import { useGetActiveLocations } from '@/hooks/useLocationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Receipt,
  Download,
  MapPin,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { exportInvoiceToExcel } from '@/utils/excelExport';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const OperatorAccounting: React.FC = () => {
  const navigate = useNavigate();
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';

  // Quick search state
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Date range filter state
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('last30');

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
  });

  // Invoice generation state
  const [invoiceMode, setInvoiceMode] = useState<'all' | 'single'>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [invoiceDateTo, setInvoiceDateTo] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [, setInvoiceError] = useState<Error | null>(null);

  // UI View State - removed showResults since we navigate to separate page

  // Fetch active locations for the company
  const { data: activeLocationsData } = useGetActiveLocations(companyId);
  const allLocations = Array.isArray(activeLocationsData?.data)
    ? activeLocationsData.data
    : [];

  // Reset location when mode changes
  React.useEffect(() => {
    setSelectedLocationId('all');
  }, [invoiceMode]);

  // Calculate date range based on filter
  const getDateRange = (filter: string) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = today.toISOString().split('T')[0];

    switch (filter) {
      case 'last7':
        dateFrom = new Date(today.setDate(today.getDate() - 7))
          .toISOString()
          .split('T')[0];
        break;
      case 'last30':
        dateFrom = new Date(today.setDate(today.getDate() - 30))
          .toISOString()
          .split('T')[0];
        break;
      case 'last90':
        dateFrom = new Date(today.setDate(today.getDate() - 90))
          .toISOString()
          .split('T')[0];
        break;
      case 'thisMonth':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];
        break;
      case 'lastMonth':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          .toISOString()
          .split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0)
          .toISOString()
          .split('T')[0];
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    return { dateFrom, dateTo };
  };

  // No need to fetch data on initial page - only fetch when navigating to results
  const { isLoading, isError, refetch } = useOperatorAccounting(companyId, {
    dateFrom: undefined,
    dateTo: undefined,
  });

  const handleQuickSearch = () => {
    if (!quickSearchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    // Get current date range or use default
    const { dateFrom, dateTo } = getDateRange(dateRangeFilter);
    const searchDateFrom = appliedFilters.dateFrom || dateFrom;
    const searchDateTo = appliedFilters.dateTo || dateTo;

    // Build query params
    const params = new URLSearchParams();
    if (searchDateFrom) params.set('dateFrom', searchDateFrom);
    if (searchDateTo) params.set('dateTo', searchDateTo);
    params.set('search', quickSearchQuery);
    params.set('page', '1');
    params.set('limit', '20');

    // Navigate to results page
    navigate(`/operator-accounting/results?${params.toString()}`);
  };

  // View accounting data for selected location/date range - Navigate to results page
  const handleViewAccounting = () => {
    if (!invoiceDateFrom || !invoiceDateTo) {
      toast.error('Please select date range');
      return;
    }

    if (
      invoiceMode === 'single' &&
      (!selectedLocationId || selectedLocationId === 'all')
    ) {
      toast.error('Please select a location');
      return;
    }

    // Build query params
    const params = new URLSearchParams();
    params.set('dateFrom', invoiceDateFrom);
    params.set('dateTo', invoiceDateTo);
    if (
      invoiceMode === 'single' &&
      selectedLocationId &&
      selectedLocationId !== 'all'
    ) {
      params.set('locationId', selectedLocationId);
    }
    params.set('page', '1');
    params.set('limit', '20');

    // Navigate to results page
    navigate(`/operator-accounting/results?${params.toString()}`);
  };

  const handleGenerateInvoice = async () => {
    if (!companyId) {
      toast.error('Company ID not found');
      return;
    }

    if (
      invoiceMode === 'single' &&
      (!selectedLocationId || selectedLocationId === 'all')
    ) {
      toast.error('Please select an operational location');
      return;
    }

    if (!invoiceDateFrom || !invoiceDateTo) {
      toast.error('Please select date range');
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError(null);

    try {
      const locationId = invoiceMode === 'single' ? selectedLocationId : null;
      const invoiceResponse = await fetchInvoice(companyId, locationId, {
        from: invoiceDateFrom,
        to: invoiceDateTo,
      });

      // Handle PDF response - fetchInvoice returns an object with download method for PDF
      if (
        invoiceResponse &&
        typeof invoiceResponse === 'object' &&
        'download' in invoiceResponse &&
        typeof (invoiceResponse as any).download === 'function'
      ) {
        // PDF blob with download method - call it to download
        (invoiceResponse as any).download();
        toast.success('Invoice generated and downloaded successfully');
      } else if (invoiceResponse instanceof Blob) {
        // Direct blob response (fallback)
        const url = window.URL.createObjectURL(invoiceResponse);
        const link = document.createElement('a');
        link.href = url;
        link.download = locationId
          ? `invoice-${companyId}-${locationId}-${invoiceDateFrom}-${invoiceDateTo}.pdf`
          : `invoice-${companyId}-all-locations-${invoiceDateFrom}-${invoiceDateTo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice generated and downloaded successfully');
      } else {
        toast.success('Invoice generated successfully');
      }
    } catch (error: any) {
      setInvoiceError(error);
      let errorMessage = 'Failed to generate invoice';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.response?.status === 500) {
        if (
          errorMessage.includes('puppeteer') ||
          errorMessage.includes('browser process')
        ) {
          toast.error(
            'Server error: PDF generation service is temporarily unavailable. Please contact support.',
          );
        } else {
          toast.error(errorMessage);
        }
      } else if (error?.response?.status === 404) {
        toast.error(
          errorMessage ||
            'Invoice endpoint not found. Please verify the API endpoint is available.',
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!companyId) {
      toast.error('Company ID not found');
      return;
    }

    if (
      invoiceMode === 'single' &&
      (!selectedLocationId || selectedLocationId === 'all')
    ) {
      toast.error('Please select an operational location');
      return;
    }

    if (!invoiceDateFrom || !invoiceDateTo) {
      toast.error('Please select date range');
      return;
    }

    try {
      const locationId = invoiceMode === 'single' ? selectedLocationId : null;
      const jsonData = await fetchInvoiceJson(companyId, locationId, {
        from: invoiceDateFrom,
        to: invoiceDateTo,
      });

      const filename = locationId
        ? `invoice-${companyId}-${locationId}-${invoiceDateFrom}-${invoiceDateTo}.xlsx`
        : `invoice-${companyId}-all-locations-${invoiceDateFrom}-${invoiceDateTo}.xlsx`;

      await exportInvoiceToExcel(jsonData, filename);
      toast.success('Excel file exported successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to export Excel file';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Company Accounting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your company's financial transactions
          </p>
        </div>
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Company Accounting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your company's financial transactions
          </p>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium">Unable to load accounting data</span>
          </div>
          <p className="text-sm mb-4">
            An unexpected error occurred while fetching accounting data.
          </p>
          <Button onClick={() => refetch()} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // No need to process data here - results are shown on separate page

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Always Visible Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Company Accounting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your company's financial transactions
          </p>
        </div>
      </div>

      {/* Invoice Generator Section */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="bg-stone-900 dark:bg-stone-800 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Invoice Generator
            </h2>
            <p className="text-sm text-gray-400">
              Create professional invoices in seconds
            </p>
          </div>
        </div>

        <CardContent className="p-6 bg-card">
          <div className="mb-2">
            <Label className="text-sm font-medium text-foreground">
              Invoice Scope
            </Label>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="inline-flex h-14 px-3 py-1.5 rounded-lg border border-border p-1 bg-muted/50">
              <button
                onClick={() => setInvoiceMode('all')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  invoiceMode === 'all'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <MapPin className="h-4 w-4" />
                All Locations
              </button>
              <button
                onClick={() => setInvoiceMode('single')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  invoiceMode === 'single'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <MapPin className="h-4 w-4" />
                Single Location
              </button>
            </div>

            <div className="ml-auto">
              <Button
                onClick={handleViewAccounting}
                className="bg-orange-500 rounded-xl hover:bg-orange-600 h-11 text-sm font-semibold text-white px-6"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <div className="flex items-end gap-4">
            {invoiceMode === 'single' && (
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-normal text-muted-foreground">
                  Location
                </Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={setSelectedLocationId}
                  disabled={!companyId}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Location</SelectItem>
                    {allLocations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.title || location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <Label className="text-sm font-normal text-muted-foreground">
                Start Date
              </Label>
              <Input
                type="date"
                value={invoiceDateFrom}
                max={invoiceDateTo || undefined}
                onChange={(e) => setInvoiceDateFrom(e.target.value)}
                className="bg-card border-border"
              />
            </div>

            <div className="flex-1 space-y-2">
              <Label className="text-sm font-normal text-muted-foreground">
                End Date
              </Label>
              <Input
                type="date"
                value={invoiceDateTo}
                min={invoiceDateFrom || undefined}
                onChange={(e) => setInvoiceDateTo(e.target.value)}
                className="bg-card border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={handleGenerateInvoice}
              disabled={
                !companyId ||
                invoiceLoading ||
                !invoiceDateFrom ||
                !invoiceDateTo
              }
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
              onClick={handleExportToExcel}
              variant="outline"
              disabled={!companyId || !invoiceDateFrom || !invoiceDateTo}
              className="border-gray-300 bg-white dark:text-black"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Search by ID Section */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="bg-gradient-to-r from-orange-400 to-orange-300 dark:from-orange-600 dark:to-orange-500 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-white/90 rounded-lg">
            <Zap className="h-5 w-5 text-[#FE6603]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Quick Search by ID
            </h2>
            <p className="text-sm text-white/80">
              Find a specific transaction instantly
            </p>
          </div>
        </div>

        <CardContent className="p-6 bg-card">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter transaction ID..."
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Button
              onClick={handleQuickSearch}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Search for individual records by ID. For bulk data export, use the
            filters below.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorAccounting;
