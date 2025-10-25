// src/pages/accounting/OperatorAccounting.tsx
import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/store';
import { useOperatorAccounting } from '@/hooks/useAccounting';
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
  Briefcase
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
  OPERATOR_FAULT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
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

const OperatorAccounting: React.FC = () => {
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';

  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
  });

  const params = useMemo(() => ({
    dateFrom: appliedFilters.dateFrom || undefined,
    dateTo: appliedFilters.dateTo || undefined,
    page: appliedFilters.page,
    limit: appliedFilters.limit,
  }), [appliedFilters]);

  const { data, isLoading, isError, refetch } = useOperatorAccounting(companyId, params);

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateFrom,
      dateTo,
      page: 1,
      limit,
    });
  };

  const handleResetFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const newDateFrom = firstDay.toISOString().split('T')[0];
    const newDateTo = lastDay.toISOString().split('T')[0];
    
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
    setPage(1);
    setLimit(20);
    setAppliedFilters({
      dateFrom: newDateFrom,
      dateTo: newDateTo,
      page: 1,
      limit: 20,
    });
  };

  const handleExport = () => {
    toast.info('Export functionality will be implemented soon');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Company Accounting</h1>
              <p className="text-sm text-muted-foreground">
                View your company's financial transactions
              </p>
            </div>
          </div>
        </div>
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Company Accounting</h1>
              <p className="text-sm text-muted-foreground">
                View your company's financial transactions
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Company Accounting</h1>
            <p className="text-sm text-muted-foreground">
              View your company's financial transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Filter your company's accounting records by date range.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleApplyFilters} 
              disabled={!dateFrom || !dateTo}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refund</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalRefund)}
              </div>
              <p className="text-xs text-muted-foreground">
                Customer refunds for your company
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPayout)}
              </div>
              <p className="text-xs text-muted-foreground">
                Your company's payouts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground">
                Yella commission from your company
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalRecords}
              </div>
              <p className="text-xs text-muted-foreground">
                Your company's financial records
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounting Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Company Financial Records</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {items.length} of {meta?.total || 0} records for your company
          </p>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No accounting records found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Try adjusting your date filters. We will show accounting records that match your criteria as soon as they are available.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Booking ID</TableHead>
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
                        {formatCurrency(item.yellacommission)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorAccounting;
