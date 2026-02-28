'use client';

import * as React from 'react';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
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

export default function BiddingSessionsPage() {
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState<'createdAt' | 'pickupAt' | 'dropAt' | 'status'>('createdAt');
  const [sortDir, setSortDir] = React.useState<'ASC' | 'DESC'>('DESC');
  const [status, setStatus] = React.useState<'ALL' | BiddingSessionStatus>('ALL');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [operationalLocationId, setOperationalLocationId] = React.useState('');

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
    sortBy,
    sortDir,
    status: status === 'ALL' ? undefined : status,
    dateFrom: dateFromIso,
    dateTo: dateToIso,
    operationalLocationId: operationalLocationId || undefined,
  });

  React.useEffect(() => {
    setPage(1);
  }, [limit, sortBy, sortDir, status, dateFromIso, dateToIso, operationalLocationId]);

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
    <div className="space-y-5">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'ALL' | BiddingSessionStatus)}>
              <SelectTrigger>
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

          <div className="space-y-1.5">
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'createdAt' | 'pickupAt' | 'dropAt' | 'status')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created At</SelectItem>
                <SelectItem value="pickupAt">Pickup Date</SelectItem>
                <SelectItem value="dropAt">Drop Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sort Direction</Label>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as 'ASC' | 'DESC')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">DESC</SelectItem>
                <SelectItem value="ASC">ASC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Rows Per Page</Label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Operational Location ID</Label>
            <Input
              value={operationalLocationId}
              placeholder="Filter by location UUID"
              onChange={(e) => setOperationalLocationId(e.target.value.trim())}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Car Class</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Drop Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actual Rental</TableHead>
                    <TableHead>Attempt #</TableHead>
                    <TableHead>Bid 1</TableHead>
                    <TableHead>Bid 2</TableHead>
                    <TableHead>Bid 3</TableHead>
                    <TableHead>Bid Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Approval Bid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                        No bidding sessions found for current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.customerName || '—'}</TableCell>
                        <TableCell>{item.carClass || '—'}</TableCell>
                        <TableCell>{formatDate(item.pickupDate)}</TableCell>
                        <TableCell>{formatDate(item.dropDate)}</TableCell>
                        <TableCell>{getLocationLabel(item)}</TableCell>
                        <TableCell>
                          {formatTime(item.pickupTime)} - {formatTime(item.dropTime)}
                        </TableCell>
                        <TableCell>{formatCurrency(item.actualRentalAmount, item.currency)}</TableCell>
                        <TableCell>{item.bidAttemptNo ?? '—'}</TableCell>
                        <TableCell>{formatBidNumber(item.bidAmount1)}</TableCell>
                        <TableCell>{formatBidNumber(item.bidAmount2)}</TableCell>
                        <TableCell>{formatBidNumber(item.bidAmount3)}</TableCell>
                        <TableCell>{item.bidStatus || '—'}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.reason || '—'}</TableCell>
                        <TableCell>{formatBidNumber(item.approvalBid)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

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
