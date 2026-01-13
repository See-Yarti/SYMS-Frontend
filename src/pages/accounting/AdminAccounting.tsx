// src/pages/accounting/AdminAccounting.tsx
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAccounting, useCompanyAccounting, fetchInvoice, fetchInvoiceJson } from '@/hooks/useAccounting';
import { useGetCompanies } from '@/hooks/useCompanyApi';
import { useGetLocations } from '@/hooks/useLocationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Building2,
  Receipt,
  Download,
  MapPin,
  Search,
  Sparkles,
  Zap,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { exportInvoiceToExcel } from '@/utils/excelExport';
import { AccountingItem, AccountingType } from '@/types/accounting';
import { cn } from '@/lib/utils';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import { toast } from 'sonner';

const typeStyles: Record<AccountingType, string> = {
  BOOKING_COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
  NO_SHOW: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  FREE_CANCEL: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  LATE_CANCEL: 'bg-[#F56304]/10 dark:bg-[#F56304]/20 text-[#F56304] dark:text-[#F56304] border-[#F56304]/30 dark:border-[#F56304]/50',
  CUSTOMER_FAULT: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  OPERATOR_FAULT: 'bg-[#F56304]/10 dark:bg-[#F56304]/20 text-[#F56304] dark:text-[#F56304] border-[#F56304]/30 dark:border-[#F56304]/50',
  PARTIAL_USE: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
};

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numValue);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const AdminAccounting: React.FC = () => {
  const navigate = useNavigate();
  
  // Quick search state
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Table search and filter state
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('last30');

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
  });

  // Invoice generation state
  const [invoiceMode, setInvoiceMode] = useState<'all' | 'single'>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
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

  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [, setInvoiceError] = useState<Error | null>(null);

  // UI View State
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 🔑 Track accounting view scope (company and location)
  const [viewCompanyId, setViewCompanyId] = useState<string | null>(null);
  const [viewLocationId, setViewLocationId] = useState<string | null>(null);
  const [viewDateFrom, setViewDateFrom] = useState<string>('');
  const [viewDateTo, setViewDateTo] = useState<string>('');

  // Fetch only verified companies for dropdown
  const { data: companiesData } = useGetCompanies({
    limit: 1000,
    page: 1,
    isVerified: true, // Only show verified companies
  });
  const companies = companiesData?.data?.companies ?? [];

  // Fetch locations for selected company (for invoice generation only)
  const { data: locationsData } = useGetLocations(selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : '');
  const locations = locationsData?.data || { activeLocations: [], inactiveLocations: [] };
  const allLocations = [...(locations.activeLocations || []), ...(locations.inactiveLocations || [])];

  // Reset location when company changes or mode changes
  React.useEffect(() => {
    setSelectedLocationId('all');
  }, [selectedCompanyId, invoiceMode]);

  // Calculate date range based on filter
  const getDateRange = (filter: string) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = today.toISOString().split('T')[0];

    switch (filter) {
      case 'last7':
        dateFrom = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'last30':
        dateFrom = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        break;
      case 'last90':
        dateFrom = new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
        break;
      case 'thisMonth':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    return { dateFrom, dateTo };
  };

  // 🔥 API params for company accounting (when showResults is true)
  const companyAccountingParams = useMemo(() => {
    if (!showResults || !viewCompanyId || !viewDateFrom || !viewDateTo) {
      return null;
    }
    return {
      companyId: viewCompanyId,
      locationId: viewLocationId || null,
      dateFrom: viewDateFrom,
      dateTo: viewDateTo,
      page: appliedFilters.page,
      limit: appliedFilters.limit,
    };
  }, [showResults, viewCompanyId, viewLocationId, viewDateFrom, viewDateTo, appliedFilters.page, appliedFilters.limit]);

  // Use company accounting API when showResults is true
  const { data: companyData, isLoading: companyLoading, isError: companyError, refetch: companyRefetch } = useCompanyAccounting(
    companyAccountingParams || { companyId: '', dateFrom: '', dateTo: '' }
  );
  
  // Admin accounting params (when showResults is false)
  const adminParams = useMemo(() => {
    const { dateFrom, dateTo } = getDateRange(dateRangeFilter);
    return {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: appliedFilters.page,
      limit: appliedFilters.limit,
    };
  }, [appliedFilters, dateRangeFilter]);

  const { data: adminData, isLoading: adminLoading, isError: adminError, refetch: adminRefetch } = useAdminAccounting(adminParams);

  // Use company data when showResults is true, otherwise use admin data
  const data = showResults ? companyData : adminData;
  const isLoading = showResults ? companyLoading : adminLoading;
  const isError = showResults ? companyError : adminError;
  const refetch = showResults ? companyRefetch : adminRefetch;

  const handleResetFilters = () => {
    setTableSearchQuery('');
    setStatusFilter('all');
    setDateRangeFilter('last30');
    setAppliedFilters({
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 20,
    });
    setViewCompanyId(null);
    setViewLocationId(null);
    setViewDateFrom('');
    setViewDateTo('');
    setShowResults(false);
  };

  const handleQuickSearch = () => {
    if (!quickSearchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    setTableSearchQuery(quickSearchQuery);
    toast.success(`Searching for "${quickSearchQuery}"`);
    setShowResults(true);
  };

  // 🔑 View accounting data for selected company/location - Navigate to results page
  const handleViewAccounting = () => {
    if (!selectedCompanyId || selectedCompanyId === 'all') {
      toast.error('Please select a company');
      return;
    }

    if (!invoiceDateFrom || !invoiceDateTo) {
      toast.error('Please select date range');
      return;
    }

    if (invoiceMode === 'single' && (!selectedLocationId || selectedLocationId === 'all')) {
      toast.error('Please select a location');
      return;
    }

    // Build query params
    const params = new URLSearchParams();
    params.set('companyId', selectedCompanyId);
    params.set('dateFrom', invoiceDateFrom);
    params.set('dateTo', invoiceDateTo);
    if (invoiceMode === 'single' && selectedLocationId && selectedLocationId !== 'all') {
      params.set('locationId', selectedLocationId);
    }
    params.set('page', '1');
    params.set('limit', '20');

    // Navigate to results page
    navigate(`/admin-accounting/results?${params.toString()}`);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedCompanyId || selectedCompanyId === 'all') {
      toast.error('Please select a company');
      return;
    }

    if (invoiceMode === 'single' && (!selectedLocationId || selectedLocationId === 'all')) {
      toast.error('Please select an operational location');
      return;
    }

    if (!invoiceDateFrom || !invoiceDateTo) {
      toast.error('Please select date range');
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError(null);
    setInvoiceData(null);

    try {
      const locationId = invoiceMode === 'single' ? selectedLocationId : null;
      const data = await fetchInvoice(
        selectedCompanyId,
        locationId,
        {
          from: invoiceDateFrom,
          to: invoiceDateTo,
        }
      );
      setInvoiceData(data);
      toast.success('Invoice generated successfully');
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
        if (errorMessage.includes('puppeteer') || errorMessage.includes('browser process')) {
          toast.error('Server error: PDF generation service is temporarily unavailable. Please contact support.');
        } else {
          toast.error(errorMessage);
        }
      } else if (error?.response?.status === 404) {
        toast.error(errorMessage || 'Invoice endpoint not found. Please verify the API endpoint is available.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoiceData) {
      toast.error('No invoice data available');
      return;
    }

    if (invoiceData.type === 'pdf' && invoiceData.download) {
      try {
        invoiceData.download();
        toast.success('Invoice downloaded successfully');
      } catch {
        toast.error('Failed to download invoice');
      }
      return;
    }

    if (invoiceData.blob) {
      try {
        const url = window.URL.createObjectURL(invoiceData.blob);
        const link = document.createElement('a');
        link.href = url;
        const locationId = invoiceMode === 'single' ? selectedLocationId : null;
        link.download = locationId
          ? `invoice-${selectedCompanyId}-${locationId}-${invoiceDateFrom}-${invoiceDateTo}.pdf`
          : `invoice-${selectedCompanyId}-all-locations-${invoiceDateFrom}-${invoiceDateTo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice downloaded successfully');
      } catch {
        toast.error('Failed to download invoice');
      }
    } else {
      toast.error('Invoice data format not supported');
    }
  };

  const handleExportToExcel = async () => {
    if (!selectedCompanyId || selectedCompanyId === 'all') {
      toast.error('Please select a company');
      return;
    }

    if (invoiceMode === 'single' && (!selectedLocationId || selectedLocationId === 'all')) {
      toast.error('Please select an operational location');
      return;
    }

    if (!invoiceDateFrom || !invoiceDateTo) {
      toast.error('Please select date range');
      return;
    }

    try {
      const locationId = invoiceMode === 'single' ? selectedLocationId : null;
      const jsonData = await fetchInvoiceJson(
        selectedCompanyId,
        locationId,
        {
          from: invoiceDateFrom,
          to: invoiceDateTo,
        }
      );

      const filename = locationId
        ? `invoice-${selectedCompanyId}-${locationId}-${invoiceDateFrom}-${invoiceDateTo}.xlsx`
        : `invoice-${selectedCompanyId}-all-locations-${invoiceDateFrom}-${invoiceDateTo}.xlsx`;

      await exportInvoiceToExcel(jsonData, filename);
      toast.success('Excel file exported successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to export Excel file';
      toast.error(errorMessage);
    }
  };

  const handlePageChange = (newPage: number) => {
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Accounting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all financial transactions across all companies
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Accounting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all financial transactions across all companies
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

  const accountingData = data?.data;
  const items = accountingData?.items || [];
  const summary = accountingData?.summary;
  const meta = accountingData;
  const totalPages = Math.ceil((meta?.total || 0) / appliedFilters.limit);
  const currentPage = appliedFilters.page;

  // 🔑 Apply client-side search/status filter only (companyId is handled by API)
  const filteredItems = items.filter((item: AccountingItem) => {
    const matchesSearch = !tableSearchQuery ||
      item.bookingid.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
      (item.companyname && item.companyname.toLowerCase().includes(tableSearchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Always Visible Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Accounting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all financial transactions across all companies
          </p>
        </div>

        {showResults && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerateInvoice}
              disabled={!selectedCompanyId || selectedCompanyId === 'all' || invoiceLoading}
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

            {invoiceData && !invoiceLoading && (
              <Button
                onClick={handleDownloadInvoice}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={!selectedCompanyId || selectedCompanyId === 'all'}
              className="border-gray-300 bg-white dark:text-black"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        )}
      </div>

      {!showResults ? (
        <>
          {/* Invoice Generator Section */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="bg-stone-900 dark:bg-stone-800 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Invoice Generator</h2>
                <p className="text-sm text-gray-400">Create professional invoices in seconds</p>
              </div>
            </div>

            <CardContent className="p-6 bg-card">
              <div className="mb-2">
                <Label className="text-sm font-medium text-foreground">Invoice Scope</Label>
              </div>

              <div className="mb-6 flex items-center gap-4">
                <div className="inline-flex h-14 px-3 py-1.5 rounded-lg border border-border p-1 bg-muted/50">
                  <button
                    onClick={() => setInvoiceMode('all')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                      invoiceMode === 'all'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                    All Locations
                  </button>
                  <button
                    onClick={() => setInvoiceMode('single')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                      invoiceMode === 'single'
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MapPin className="h-4 w-4" />
                    Single Location
                  </button>
                </div>

                <div className="ml-auto">
                  <Button
                    onClick={handleViewAccounting}
                    disabled={!selectedCompanyId || selectedCompanyId === 'all'}
                    className="bg-orange-500 rounded-xl hover:bg-orange-600 h-11 text-sm font-semibold text-white px-6"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-normal text-muted-foreground">Company</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Company</SelectItem>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {invoiceMode === 'single' && (
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-normal text-muted-foreground">Location</Label>
                    <Select
                      value={selectedLocationId}
                      onValueChange={setSelectedLocationId}
                      disabled={!selectedCompanyId || selectedCompanyId === 'all'}
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
                  <Label className="text-sm font-normal text-muted-foreground">Start Date</Label>
                  <Input
                    type="date"
                    value={invoiceDateFrom}
                    max={invoiceDateTo || undefined}
                    onChange={(e) => setInvoiceDateFrom(e.target.value)}
                    className="bg-card border-border"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-normal text-muted-foreground">End Date</Label>
                  <Input
                    type="date"
                    value={invoiceDateTo}
                    min={invoiceDateFrom || undefined}
                    onChange={(e) => setInvoiceDateTo(e.target.value)}
                    className="bg-card border-border"
                  />
                </div>
              </div>

              {invoiceData && (
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleDownloadInvoice} variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <span className="text-sm text-green-600">Invoice generated successfully!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Search by ID Section */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="bg-gradient-to-r from-orange-400 to-orange-300 dark:from-orange-600 dark:to-orange-500 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-white/90 rounded-lg">
                <Zap className="h-5 w-5 text-[#FE6603]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Quick Search by ID</h2>
                <p className="text-sm text-white/80">Find a specific transaction instantly</p>
              </div>
            </div>

            <CardContent className="p-6 bg-card">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter transaction ID, company name, or location..."
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
                Search for individual records by ID, company, or location. For bulk data export, use the filters below.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <div ref={resultsRef}>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border border-blue-200 dark:border-blue-900/50 shadow-sm bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-normal text-muted-foreground">Total Refund</p>
                      <p className="text-3xl font-medium text-foreground mt-1">
                        {Number(summary.totalRefund || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <TrendingDown className="h-6 w-6 text-[#155DFC] dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-purple-200 dark:border-purple-900/50 shadow-sm bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-normal text-muted-foreground">Total Payout</p>
                      <p className="text-3xl font-medium text-foreground mt-1">
                        {formatCurrency(summary.totalPayout)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <DollarSign className="h-6 w-6 text-[#6700FF] dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 dark:border-green-900/50 shadow-sm bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-normal text-muted-foreground">Total Commissions</p>
                      <p className="text-3xl font-medium text-foreground mt-1">
                        {formatCurrency(summary.totalCommission)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-[#009410] dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-orange-200 dark:border-orange-900/50 shadow-sm bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-normal text-muted-foreground">Total Owes</p>
                      <p className="text-3xl font-medium text-foreground mt-1">
                        {formatCurrency(summary.totalOwes || '0.00')}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#F56304]/30 dark:border-[#F56304]/50 shadow-sm bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-normal text-muted-foreground">Total Records</p>
                      <p className="text-3xl font-medium text-foreground mt-1">
                        {summary.totalRecords}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F56304]/10 dark:bg-[#F56304]/20 rounded-xl">
                      <ClipboardList className="h-6 w-6 text-[#F56304] dark:text-[#F56304]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by ID, company, or location..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="pl-10 bg-card border-border"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-card border-border">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="w-[160px] bg-card border-border">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last90">Last 90 days</SelectItem>
                    <SelectItem value="thisMonth">This month</SelectItem>
                    <SelectItem value="lastMonth">Last month</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset filters
                </Button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No accounting records found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Try adjusting your filters. We will show accounting records that match your criteria as soon as they are available.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-foreground truncate">Type</TableHead>
                          <TableHead className="font-semibold text-foreground truncate">BookingID</TableHead>
                          <TableHead className="font-semibold text-foreground truncate">Company</TableHead>
                          <TableHead className="font-semibold text-foreground truncate">Status</TableHead>
                          <TableHead className="font-semibold text-foreground truncate">Pickup Date</TableHead>
                          <TableHead className="font-semibold text-foreground truncate">Drop Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-center truncate">Customer Refund</TableHead>
                          <TableHead className="font-semibold text-foreground text-center truncate">Operator Payout</TableHead>
                          <TableHead className="font-semibold text-foreground text-center truncate">Commission</TableHead>
                          <TableHead className="font-semibold text-foreground text-center truncate">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item: AccountingItem) => (
                          <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs font-semibold px-2 py-1 border',
                                  typeStyles[item.type]
                                )}
                              >
                                {item.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {item.bookingid.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-medium text-foreground truncate">
                              {item.companyname || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(item.pickupat)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(item.dropat)}
                            </TableCell>
                            <TableCell className="text-center font-mono text-foreground">
                              {formatCurrency(item.customerrefund)}
                            </TableCell>
                            <TableCell className="text-center font-mono text-foreground">
                              {formatCurrency(item.operatorpayout)}
                            </TableCell>
                            <TableCell className="text-center font-mono text-foreground">
                              {formatCurrency(item.yellacommission)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm truncate">
                              {formatDateTime(item.createdat)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredItems.length} of {meta?.total || 0} transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="border-border"
                      >
                        Previous
                      </Button>

                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "w-9",
                              currentPage === pageNum
                                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                : "border-border"
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="border-border"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAccounting;