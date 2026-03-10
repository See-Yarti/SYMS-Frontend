'use client';

import * as React from 'react';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw } from 'lucide-react';
import { useCompanyBiddingSessions } from '@/hooks/useCompanyBiddingSessions';
import type {
  BiddingSessionStatus,
  CompanyBiddingSessionItem,
} from '@/api/bidding/bidding.types';

const STATUS_OPTIONS: Array<{ label: string; value: 'ALL' | BiddingSessionStatus }> = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'ACCEPTED', value: 'ACCEPTED' },
  { label: 'LOCKED', value: 'LOCKED' },
  { label: 'CANCELLED', value: 'CANCELLED' },
  { label: 'COMPLETED', value: 'COMPLETED' },
];

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
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

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
};

const formatCurrency = (amount?: number | null, currency?: string | null) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)} ${currency || 'USD'}`;
  }
};

const formatBidNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(2);
};

const getLocationLabel = (item: CompanyBiddingSessionItem) => {
  if (!item.location) return '—';
  return item.location.title || item.location.addressLine || item.location.city || '—';
};

const getStatusBadgeClass = (status: BiddingSessionStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ACCEPTED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'LOCKED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'COMPLETED':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return '';
  }
};

export default function BiddingSessionsPage() {
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';
  const monthRange = React.useMemo(() => getCurrentMonthRange(), []);

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [status, setStatus] = React.useState<'ALL' | BiddingSessionStatus>('ALL');
  const [dateFrom, setDateFrom] = React.useState(monthRange.from);
  const [dateTo, setDateTo] = React.useState(monthRange.to);

  const dateFromIso = React.useMemo(() => {
    if (!dateFrom) return undefined;
    return new Date(`${dateFrom}T00:00:00.000Z`).toISOString();
  }, [dateFrom]);

  const dateToIso = React.useMemo(() => {
    if (!dateTo) return undefined;
    return new Date(`${dateTo}T23:59:59.999Z`).toISOString();
  }, [dateTo]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCompanyBiddingSessions(companyId, {
    page,
    limit,
    status: status === 'ALL' ? undefined : status,
    dateFrom: dateFromIso,
    dateTo: dateToIso,
  });

  React.useEffect(() => {
    setPage(1);
  }, [limit, status, dateFromIso, dateToIso]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.limit ?? limit)));

  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    'Failed to load bidding sessions.';

  if (!companyId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            Company ID not found in your operator session. Please re-login.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 min-w-0 w-full max-w-[1400px] overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bidding Sessions</h1>
          <p className="text-sm text-muted-foreground">
            All bidding sessions for your company.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'ALL' | BiddingSessionStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label>Date From</Label>
            <Input className="w-full" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label>Date To</Label>
            <Input className="w-full" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full min-w-0">
        <CardContent className="pt-6 min-w-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-6 w-6 animate-spin text-[#F56304]" />
            </div>
          ) : isError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          ) : (
            <>
              <div className="w-full max-w-full rounded-lg border border-gray-200 overflow-x-auto">
                <Table className="min-w-[2400px] text-sm">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Bid Code</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Car Class</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Drop Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Actual Rental</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Attempt #</TableHead>
                    <TableHead>Bid 1</TableHead>
                    <TableHead>Bid 2</TableHead>
                    <TableHead>Bid 3</TableHead>
                    <TableHead>Bid Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Approval Bid</TableHead>
                    <TableHead>Accepted At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Lock End At</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={21} className="text-center py-8 text-muted-foreground">
                        No bidding sessions found for current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50/80">
                        <TableCell className="font-mono text-xs">{item.bidCode ?? item.id}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.customerName || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.carClass || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(item.pickupDate)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(item.dropDate)}</TableCell>
                        <TableCell>
                          {formatTime(item.pickupTime)} - {formatTime(item.dropTime)}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate" title={getLocationLabel(item)}>
                          {getLocationLabel(item)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(item.actualRentalAmount, item.currency)}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.currency || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.bidAttemptNo ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatBidNumber(item.bidAmount1)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatBidNumber(item.bidAmount2)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatBidNumber(item.bidAmount3)}</TableCell>
                        <TableCell>
                          {item.bidStatus ? (
                            <Badge
                              variant="outline"
                              className={
                                item.bidStatus === 'Passed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }
                            >
                              {item.bidStatus}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeClass(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{item.reason || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatBidNumber(item.approvalBid)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(item.acceptedAt)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(item.expiresAt)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(item.lockEndAt)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(item.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing page {data?.page ?? page} of {totalPages} ({total} total sessions)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isFetching}
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
}
