'use client';

// src/pages/accounting/OperatorAccountingResults.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from '@/hooks/useNextNavigation';
import { useAppSelector } from '@/store';
import {
  useOperatorAccounting,
  fetchInvoice,
  fetchInvoiceJson,
} from '@/hooks/useAccounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  RefreshCw,
  Receipt,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { exportInvoiceToExcel } from '@/utils/excelExport';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AccountingItem,
  AccountingType,
  CompanyAccountingItem,
} from '@/types/accounting';

const isCompanyFormat = (
  item: AccountingItem | CompanyAccountingItem,
): item is CompanyAccountingItem =>
  'bookingCode' in item && 'netBooking' in item;

const statusStyles: Record<
  string,
  { bg: string; text: string; icon?: React.ReactNode; label: string }
> = {
  PENDING: {
    bg: 'bg-[#F56304]/10 dark:bg-[#F56304]/20 border border-[#F56304]/30 dark:border-[#F56304]/50',
    text: 'text-[#F56304] dark:text-[#F56304]',
    icon: <Clock className="w-3.5 h-3.5" />,
    label: 'Pending',
  },
  CONFIRMED: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-600 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Confirmed',
  },
  COMPLETED: {
    bg: 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700',
    text: 'text-blue-600 dark:text-blue-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Completed',
  },
  CANCELLED: {
    bg: 'bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700',
    text: 'text-rose-600 dark:text-rose-300',
    label: 'Cancelled',
  },
  IN_PROGRESS: {
    bg: 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700',
    text: 'text-purple-600 dark:text-purple-300',
    label: 'In Progress',
  },
  SCHEDULED: {
    bg: 'bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700',
    text: 'text-sky-600 dark:text-sky-300',
    label: 'Scheduled',
  },
};

const paymentStyles: Record<string, { bg: string; text: string }> = {
  UNPAID: {
    bg: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
    text: 'text-gray-500 dark:text-gray-300',
  },
  PREPAID: {
    bg: 'bg-[#ECFDF5] dark:bg-emerald-600 border border-[#A4F4CF]',
    text: 'text-[#007A55]',
  },
  POSTPAID: {
    bg: 'bg-[#FFF7ED] dark:bg-orange-600 border border-[#FFD6A7]',
    text: 'text-[#CA3500]',
  },
  PAID: {
    bg: 'bg-emerald-500 dark:bg-emerald-600',
    text: 'text-white',
  },
  PENDING: {
    bg: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
    text: 'text-gray-500 dark:text-gray-300',
  },
};

const typeStyles: Record<AccountingType, string> = {
  BOOKING_COMPLETED:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FREE_CANCEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LATE_CANCEL:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CUSTOMER_FAULT:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  OPERATOR_FAULT:
    'bg-[#F56304]/10 text-[#F56304] dark:bg-[#F56304]/20 dark:text-[#F56304]',
  PARTIAL_USE:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

const formatCurrency = (
  value?: string | number | null,
  currency?: string | null,
) => {
  if (!value) return '$0.00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 2,
  }).format(numValue);
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const OperatorAccountingResults: React.FC = () => {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';

  // Get params from URL
  const locationId = searchParams?.get('locationId') || null;
  const dateFrom = searchParams?.get('dateFrom') || '';
  const dateTo = searchParams?.get('dateTo') || '';
  const page = parseInt(searchParams?.get('page') || '1', 10);
  const limit = parseInt(searchParams?.get('limit') || '20', 10);
  const searchQuery = searchParams?.get('search') || '';

  const [tableSearchQuery, setTableSearchQuery] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // API params - include locationId when "Single Location" was selected
  const operatorParams = useMemo(() => {
    if (!companyId || !dateFrom || !dateTo) {
      return null;
    }
    return {
      dateFrom,
      dateTo,
      page,
      limit,
      locationId: locationId && locationId !== 'all' ? locationId : null,
    };
  }, [companyId, dateFrom, dateTo, page, limit, locationId]);

  // Fetch accounting data
  const { data, isLoading, isError, refetch } = useOperatorAccounting(
    companyId,
    operatorParams || { dateFrom: '', dateTo: '' },
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams || undefined);
    params.set('page', String(newPage));
    navigate(`/operator-accounting/results?${params.toString()}`, {
      replace: true,
    });
  };

  const handleGenerateInvoice = async () => {
    if (!companyId) {
      toast.error('Company ID not found');
      return;
    }

    if (!dateFrom || !dateTo) {
      toast.error('Please select date range (from and to dates are required)');
      return;
    }

    setInvoiceLoading(true);

    try {
      const locationIdParam =
        locationId && locationId !== 'all' ? locationId : null;
      // Fetch PDF directly from backend
      const invoiceResponse = await fetchInvoice(companyId, locationIdParam, {
        from: dateFrom,
        to: dateTo,
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
        link.download = locationIdParam
          ? `invoice-${companyId}-${locationIdParam}-${dateFrom}-${dateTo}.pdf`
          : `invoice-${companyId}-all-locations-${dateFrom}-${dateTo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice generated and downloaded successfully');
      } else {
        toast.success('Invoice generated successfully');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate invoice';
      toast.error(errorMessage);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!companyId) {
      toast.error('Company ID not found');
      return;
    }

    if (!dateFrom || !dateTo) {
      toast.error('Please select date range');
      return;
    }

    try {
      const locationIdParam =
        locationId && locationId !== 'all' ? locationId : null;
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

  const accountingData = data?.data;
  const items = accountingData?.items || [];
  const summary = accountingData?.summary;
  const meta = accountingData;
  const totalPages = Math.ceil((meta?.total || 0) / limit);
  const currentPage = page;

  // Apply client-side search/status filter
  const filteredItems = items.filter(
    (item: AccountingItem | CompanyAccountingItem) => {
      const bookingCode = isCompanyFormat(item)
        ? item.bookingCode
        : (item as AccountingItem).bookingcode ||
          (item as AccountingItem).bookingid ||
          '';
      const matchesSearch =
        !tableSearchQuery ||
        bookingCode.toLowerCase().includes(tableSearchQuery.toLowerCase());

      const status = isCompanyFormat(item)
        ? item.bookingStatus
        : (item as AccountingItem).status;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    },
  );

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/operator-accounting')}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Company Accounting
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View your company's financial transactions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerateInvoice}
            disabled={!companyId || invoiceLoading}
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
            disabled={!companyId}
            className="border-gray-300 bg-white dark:text-black"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-blue-200 dark:border-blue-900/50 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-normal text-muted-foreground">
                    Total Refund
                  </p>
                  <p className="text-3xl font-medium text-foreground mt-1">
                    {formatCurrency(summary.totalRefund)}
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
                  <p className="text-sm font-normal text-muted-foreground">
                    Total Payout
                  </p>
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
                  <p className="text-sm font-normal text-muted-foreground">
                    Total Commissions
                  </p>
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
                  <p className="text-sm font-normal text-muted-foreground">
                    Total Owes
                  </p>
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
                  <p className="text-sm font-normal text-muted-foreground">
                    Total Records
                  </p>
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

      {/* Table */}
      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by booking code..."
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
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No accounting records found
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Try adjusting your filters. We will show accounting records that
                match your criteria as soon as they are available.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {items.length > 0 && isCompanyFormat(items[0]) ? (
                        <>
                          <TableHead className="font-semibold text-foreground truncate">
                            Booking Code
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Customer
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Car Class
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Pickup Date
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Pickup Location
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Type
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-right truncate">
                            Net Booking
                          </TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-semibold text-foreground truncate">
                            Booking Code
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Type
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Paid Status
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Pickup Date
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Drop Date
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-right truncate">
                            Customer Refund
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-right truncate">
                            Operator Payout
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-right truncate">
                            Commission
                          </TableHead>
                          <TableHead className="font-semibold text-foreground truncate">
                            Created
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 && isCompanyFormat(items[0])
                      ? filteredItems.map((item, index) => {
                          const companyItem = item as CompanyAccountingItem;
                          const statusKey =
                            (companyItem.bookingStatus ?? '').toUpperCase() ||
                            'PENDING';
                          const statusStyle = statusStyles[statusKey] ?? {
                            bg: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
                            text: 'text-gray-600 dark:text-gray-300',
                            label:
                              (companyItem.bookingStatus ?? '').replace(
                                /_/g,
                                ' ',
                              ) || 'Pending',
                          };
                          return (
                            <TableRow
                              key={`${companyItem.bookingCode}-${index}`}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-medium font-mono text-sm">
                                {companyItem.bookingId ? (
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/all-bookings/${companyItem.bookingId}`,
                                      )
                                    }
                                    className="text-orange-500 hover:text-orange-600 hover:underline transition-colors cursor-pointer"
                                  >
                                    {companyItem.bookingCode}
                                  </button>
                                ) : (
                                  companyItem.bookingCode
                                )}
                              </TableCell>
                              <TableCell>{companyItem.customerName}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {companyItem.carClass}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(companyItem.pickupDate)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {companyItem.pickupLocation}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal rounded-lg',
                                    statusStyle.bg,
                                    statusStyle.text,
                                  )}
                                >
                                  {statusStyle.icon}
                                  {statusStyle.label}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {(companyItem.bookingType ?? '').replace(
                                    /_/g,
                                    ' ',
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-foreground font-semibold">
                                {formatCurrency(companyItem.netBooking)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      : filteredItems.map((item) => {
                          const legacyItem = item as AccountingItem;
                          const statusKey =
                            legacyItem.status?.toUpperCase() ?? 'PENDING';
                          const statusStyle = statusStyles[statusKey] ?? {
                            bg: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
                            text: 'text-gray-600 dark:text-gray-300',
                            label: legacyItem.status || 'Pending',
                          };
                          const paymentKey =
                            legacyItem.paidstatus?.toUpperCase() ?? 'UNPAID';
                          const paymentStyle =
                            paymentStyles[paymentKey] ?? paymentStyles.UNPAID;

                          return (
                            <TableRow
                              key={legacyItem.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/all-bookings/${legacyItem.bookingid}`,
                                    )
                                  }
                                  className="text-orange-500 hover:text-orange-600 hover:underline transition-colors cursor-pointer"
                                >
                                  {legacyItem.bookingcode ||
                                    legacyItem.bookingid}
                                </button>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={typeStyles[legacyItem.type] || ''}
                                >
                                  {(legacyItem.type ?? 'Unknown').replace(
                                    /_/g,
                                    ' ',
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal rounded-lg',
                                    statusStyle.bg,
                                    statusStyle.text,
                                  )}
                                >
                                  {statusStyle.icon}
                                  {statusStyle.label}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg',
                                    paymentStyle.bg,
                                    paymentStyle.text,
                                  )}
                                >
                                  {legacyItem.paidstatus?.toUpperCase() ||
                                    'UNPAID'}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(legacyItem.pickupat)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(legacyItem.dropat)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-foreground">
                                {formatCurrency(legacyItem.customerrefund)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-foreground">
                                {formatCurrency(legacyItem.operatorpayout)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-foreground font-semibold">
                                {formatCurrency(legacyItem.yalacommission)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {legacyItem.createdat
                                  ? formatDate(legacyItem.createdat)
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredItems.length} of {meta?.total || 0}{' '}
                  transactions
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
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          'w-9',
                          currentPage === pageNum
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                            : 'border-border',
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
  );
};

export default OperatorAccountingResults;
