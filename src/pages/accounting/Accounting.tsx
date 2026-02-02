// src/pages/accounting/Accounting.tsx
import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/store';
import { useAdminAccounting, useOperatorAccounting } from '@/hooks/useAccounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Calendar,
  Building2,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { AccountingItem, AccountingType } from '@/types/accounting';
import { cn } from '@/lib/utils';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import { toast } from 'sonner';

const typeStyles: Record<AccountingType, string> = {
  BOOKING_COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  FREE_CANCEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  LATE_CANCEL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  CUSTOMER_FAULT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  OPERATOR_FAULT: 'bg-[#F56304]/10 text-[#F56304] dark:bg-[#F56304]/20 dark:text-[#F56304]',
  PARTIAL_USE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
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

const Accounting: React.FC = () => {
  const { user, otherInfo } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const companyId = otherInfo?.companyId || '';

  const [dateFrom, setDateFrom] = useState('2025-08-01');
  const [dateTo, setDateTo] = useState('2025-10-31');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const params = useMemo(() => {
    const apiParams = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit,
    };
    
    // Debug log to show API parameters
    console.log('Accounting API Parameters:', {
      isAdmin,
      companyId: isAdmin ? 'N/A (Admin)' : companyId,
      apiParams,
      apiUrl: isAdmin 
        ? `GET: /api/accounting/admin?dateFrom=${apiParams.dateFrom}&dateTo=${apiParams.dateTo}&page=${apiParams.page}&limit=${apiParams.limit}`
        : `GET: /api/accounting/company/${companyId}?dateFrom=${apiParams.dateFrom}&dateTo=${apiParams.dateTo}&page=${apiParams.page}&limit=${apiParams.limit}`
    });
    
    return apiParams;
  }, [dateFrom, dateTo, page, limit, isAdmin, companyId]);

  const { data: adminData, isLoading: adminLoading, isError: adminError, refetch: adminRefetch } = useAdminAccounting(params);
  const { data: operatorData, isLoading: operatorLoading, isError: operatorError, refetch: operatorRefetch } = useOperatorAccounting(companyId, params);

  const data = isAdmin ? adminData : operatorData;
  const isLoading = isAdmin ? adminLoading : operatorLoading;
  const isError = isAdmin ? adminError : operatorError;
  const refetch = isAdmin ? adminRefetch : operatorRefetch;

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setLimit(20);
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented soon');
  };

  if (isLoading) {
    return (
      <div className="accounting-container">
        <div className="accounting-header">
          <div className="accounting-title-section">
            <div className="accounting-title-wrapper">
              <div className="accounting-icon-wrapper">
                <Calculator className="accounting-icon" />
              </div>
              <div>
                <h1 className="accounting-title">Accounting</h1>
                <p className="accounting-subtitle">
                  {isAdmin ? 'View all financial transactions' : 'View your company financial transactions'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="error-state-container">
        <div className="accounting-header">
          <div className="accounting-title-section">
            <div className="accounting-title-wrapper">
              <div className="accounting-icon-wrapper">
                <Calculator className="accounting-icon" />
              </div>
              <div>
                <h1 className="accounting-title">Accounting</h1>
                <p className="accounting-subtitle">
                  {isAdmin ? 'View all financial transactions' : 'View your company financial transactions'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="error-state-card">
          <div className="error-state-header">
            <div className="error-state-title">
              <RefreshCw className="error-state-icon" />
              Unable to load accounting data
            </div>
            <div className="error-state-description">
              An unexpected error occurred while fetching accounting data.
            </div>
          </div>
          <div className="error-state-content">
            <Button onClick={() => refetch()} variant="destructive">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const accountingData = data?.data;
  const items = accountingData?.items || [];
  const summary = accountingData?.summary;
  const meta = accountingData;

  return (
    <div className="accounting-container">
      <div className="accounting-header">
        <div className="accounting-title-section">
          <div className="accounting-title-wrapper">
            <div className="accounting-icon-wrapper">
              <Calculator className="accounting-icon" />
            </div>
            <div>
              <h1 className="accounting-title">Accounting</h1>
              <p className="accounting-subtitle">
                {isAdmin ? 'View all financial transactions' : 'View your company financial transactions'}
              </p>
            </div>
          </div>
        </div>
        <div className="accounting-actions">
          <Button variant="outline" onClick={handleResetFilters} className="accounting-reset-btn">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Receipt className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="accounting-filters-card">
        <div className="accounting-filters-header">
          <div className="accounting-filters-title">
            <Calendar className="accounting-filters-icon" />
            Filters
          </div>
          <div className="accounting-filters-description">
            Filter accounting records by date range.
          </div>
        </div>
        <div className="accounting-filters-content">
          <div className="accounting-filters-grid">
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                className="accounting-date-input"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                className="accounting-date-input"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="accounting-filters-actions flex justify-end mt-4">
            <Button 
              onClick={() => refetch()} 
              className="accounting-apply-filters-btn"
              disabled={!dateFrom || !dateTo}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="accounting-summary-grid">
          <Card className="accounting-summary-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refund</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalRefund)}
              </div>
              <p className="text-xs text-muted-foreground">
                Customer refunds
              </p>
            </CardContent>
          </Card>

          <Card className="accounting-summary-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPayout)}
              </div>
              <p className="text-xs text-muted-foreground">
                Operator payouts
              </p>
            </CardContent>
          </Card>

          <Card className="accounting-summary-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground">
                Yella commission
              </p>
            </CardContent>
          </Card>

          <Card className="accounting-summary-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Owes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalOwes || '0.00')}
              </div>
              <p className="text-xs text-muted-foreground">
                Company owes to YalaRide
              </p>
            </CardContent>
          </Card>

          <Card className="accounting-summary-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalRecords}
              </div>
              <p className="text-xs text-muted-foreground">
                Financial records
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounting Items Table */}
      <div className="accounting-results-card">
        <div className="accounting-results-header">
          <div className="accounting-results-title">
            <Receipt className="accounting-results-icon" />
            Financial Records
          </div>
          <div className="accounting-results-description">
            Showing {items.length} of {meta?.total || 0} records
          </div>
        </div>
        <div className="accounting-results-content">
          {items.length === 0 ? (
            <div className="accounting-empty-state">
              <Calculator className="accounting-empty-icon" />
              <h3 className="accounting-empty-title">No accounting records found</h3>
              <p className="accounting-empty-description">
                Try adjusting your date filters. We will show accounting records that match your criteria as soon as they are available.
              </p>
            </div>
          ) : (
            <div className="accounting-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Booking ID</TableHead>
                    {isAdmin && <TableHead>Company</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Drop Date</TableHead>
                    <TableHead className="text-right">Customer Refund</TableHead>
                    <TableHead className="text-right">Operator Payout</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: AccountingItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge className={cn('accounting-type-badge', typeStyles[item.type])}>
                          {item.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.bookingid.slice(0, 8)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {item.companyname || 'N/A'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(item.pickupat)}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.dropat)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.customerrefund)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.operatorpayout)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.yalacommission)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(item.createdat)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accounting;
