// src/pages/operators/OperatorBookings.tsx

import React from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useAppSelector } from '@/store';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarClock, CalendarRange, Filter, RefreshCw, Search, UserCircle } from 'lucide-react';
import { Booking } from '@/types/booking';
import { cn } from '@/lib/utils';
import { InlineLoader, PageLoadingSkeleton } from '@/components/ui/loading';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SCHEDULED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
};



const formatCurrency = (value?: string | number | null, currency?: string | null) => {
  if (!value) return '—';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency ?? 'USD',
      minimumFractionDigits: 2,
    }).format(numValue);
  } catch {
    return `${numValue.toFixed(2)} ${currency ?? ''}`.trim();
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const OperatorBookings: React.FC = () => {
  const { user, otherInfo } = useAppSelector((state) => state.auth);
  const isOperator = user?.role === 'operator';
  const operatorRole = user?.operatorRole ?? otherInfo?.operatorRole;

  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortDir, setSortDir] = React.useState<'ASC' | 'DESC'>('DESC');
  const [limit, setLimit] = React.useState(10);
  const [page, setPage] = React.useState(1);
  const [dateFromInput, setDateFromInput] = React.useState('');
  const [dateToInput, setDateToInput] = React.useState('');

  const [debouncedSearch] = useDebounce(searchTerm, 400);

  const dateFromIso = React.useMemo(() => {
    if (!dateFromInput) return undefined;
    return new Date(`${dateFromInput}T00:00:00.000Z`).toISOString();
  }, [dateFromInput]);

  const dateToIso = React.useMemo(() => {
    if (!dateToInput) return undefined;
    return new Date(`${dateToInput}T23:59:59.999Z`).toISOString();
  }, [dateToInput]);

  const { data, isLoading, isError, error, isFetching, refetch } = useBookings({
    search: debouncedSearch || undefined,
    sortDir,
    dateFrom: dateFromIso,
    dateTo: dateToIso,
    page,
    limit,
  });

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortDir, dateFromIso, dateToIso, limit]);

  const bookings = data?.bookings ?? [];
  const meta = data?.meta ?? { ok: true, page: 1, limit, total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  if (!isOperator && !operatorRole) {
    return (
      <div className="access-restricted-container">
        <div className="access-restricted-card">
          <div className="access-restricted-header">
            <div className="access-restricted-title">Access Restricted</div>
            <div className="access-restricted-description">
              This section is available only for operator accounts.
            </div>
          </div>
          <div className="access-restricted-content">
            <p className="access-restricted-message">
              If you believe this is a mistake, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="operator-bookings-container">
        <div className="operator-bookings-header">
          <div className="operator-bookings-title-section">
            <div className="operator-bookings-title-wrapper">
              <div className="operator-bookings-icon-wrapper">
                <CalendarClock className="operator-bookings-icon" />
              </div>
              <div>
                <h1 className="operator-bookings-title">
                  Operator Bookings
                </h1>
                <p className="operator-bookings-subtitle">
                  Manage your company's booking operations
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
        <div className="operator-bookings-header">
          <div className="operator-bookings-title-section">
            <div className="operator-bookings-title-wrapper">
              <div className="operator-bookings-icon-wrapper">
                <CalendarClock className="operator-bookings-icon" />
              </div>
              <div>
                <h1 className="operator-bookings-title">
                  Operator Bookings
                </h1>
                <p className="operator-bookings-subtitle">
                  Manage your company's booking operations
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="error-state-card">
          <div className="error-state-header">
            <div className="error-state-title">
              <RefreshCw className="error-state-icon" />
              Unable to load bookings
            </div>
            <div className="error-state-description">
              {(error as Error)?.message ?? 'An unexpected error occurred while fetching bookings.'}
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

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortDir('DESC');
    setLimit(10);
    setPage(1);
    setDateFromInput('');
    setDateToInput('');
  };

  const canGoBack = page > 1;
  const canGoForward = page < totalPages && bookings.length === limit;

  return (
    <div className="operator-bookings-container">
      <div className="operator-bookings-header">
        <div className="operator-bookings-title-section">
          <div className="operator-bookings-title-wrapper">
            <div className="operator-bookings-icon-wrapper">
              <CalendarClock className="operator-bookings-icon" />
            </div>
            <div>
              <h1 className="operator-bookings-title">
                Operator Bookings
              </h1>
              <p className="operator-bookings-subtitle">
                Manage your company's booking operations
              </p>
            </div>
          </div>
        </div>
        <div className="operator-bookings-actions">
          {isFetching && <InlineLoader size="sm" message="Refreshing" />}
          <Button variant="outline" onClick={handleResetFilters} className="operator-bookings-reset-btn">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </div>

      <div className="operator-bookings-filters-card">
        <div className="operator-bookings-filters-header">
          <div className="operator-bookings-filters-title">
            <Filter className="operator-bookings-filters-icon" />
            Filters
          </div>
          <div className="operator-bookings-filters-description">
            Narrow down the bookings list by search keywords, date range, or order direction.
          </div>
        </div>
        <div className="operator-bookings-filters-content">
          <div className="operator-bookings-filters-grid">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="operator-bookings-search-wrapper">
                <Search className="operator-bookings-search-icon" />
                <Input
                  id="search"
                  placeholder="Search by passenger, reference, driver..."
                  className="operator-bookings-search-input"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="date-from">Date from</Label>
              <Input
                id="date-from"
                type="date"
                className="operator-bookings-date-input"
                value={dateFromInput}
                max={dateToInput || undefined}
                onChange={(event) => setDateFromInput(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to">Date to</Label>
              <Input
                id="date-to"
                type="date"
                className="operator-bookings-date-input"
                value={dateToInput}
                min={dateFromInput || undefined}
                onChange={(event) => setDateToInput(event.target.value)}
              />
            </div>

            <div className="operator-bookings-select-grid">
              <div>
                <Label>Sort</Label>
                <Select value={sortDir} onValueChange={(value: 'ASC' | 'DESC') => setSortDir(value)}>
                  <SelectTrigger className="operator-bookings-select-trigger">
                    <SelectValue placeholder="Sort direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESC">Newest first</SelectItem>
                    <SelectItem value="ASC">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Per page</Label>
                <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
                  <SelectTrigger className="operator-bookings-select-trigger">
                    <SelectValue placeholder="Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="operator-bookings-results-card">
        <div className="operator-bookings-results-header">
          <div className="operator-bookings-results-title">
            <UserCircle className="operator-bookings-results-icon" />
            Bookings
          </div>
          <div className="operator-bookings-results-description">
            Showing {bookings.length ? `${(meta.page - 1) * meta.limit + 1} – ${Math.min(meta.page * meta.limit, meta.total)}` : 0}{' '}
            of {meta.total} bookings
          </div>
        </div>
        <div className="operator-bookings-results-content">
          {bookings.length === 0 ? (
            <div className="operator-bookings-empty-state">
              <CalendarRange className="operator-bookings-empty-icon" />
              <h3 className="operator-bookings-empty-title">No bookings found</h3>
              <p className="operator-bookings-empty-description">
                Try adjusting your filters or search keywords. We will show bookings that match your criteria as soon as they are available.
              </p>
            </div>
          ) : (
            <div className="operator-bookings-grid">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}

          <Separator />

          <div className="operator-bookings-pagination">
            <p className="operator-bookings-pagination-info">
              Page {meta.page} of {totalPages}
            </p>
            <div className="operator-bookings-pagination-controls">
              <Button variant="outline" disabled={!canGoBack} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Previous
              </Button>
              <Button variant="outline" disabled={!canGoForward} onClick={() => setPage((prev) => prev + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
  const statusKey = booking.status?.toUpperCase() ?? 'PENDING';
  const statusClass = statusStyles[statusKey] ?? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <div className="booking-card-header-content">
          <div className="booking-card-title-section">
            <div className="booking-card-title">
              Booking #{booking.id.slice(0, 8)}
            </div>
            <div className="booking-card-subtitle">
              Created {formatDateTime(booking.createdAt)}
            </div>
          </div>
          <div className="booking-card-badges">
            <Badge className={cn('booking-card-status-badge', statusClass)}>
              {booking.status}
            </Badge>
            <Badge variant="outline" className="booking-card-paid-badge">
              {booking.paidStatus}
            </Badge>
          </div>
        </div>
      </div>
      <div className="booking-card-content">
        <div className="booking-card-info-grid">
          <div>
            <p className="booking-card-info-label">Location</p>
            <p className="booking-card-info-value">{booking.operationalLocation.city}</p>
            <p className="booking-card-info-secondary">{booking.operationalLocation.addressLine}</p>
          </div>
          <div>
            <p className="booking-card-info-label">Vehicle</p>
            <p className="booking-card-info-value">{booking.car.make} {booking.car.model}</p>
            <p className="booking-card-info-secondary">{booking.car.passengers} passengers • {booking.car.doors} doors</p>
          </div>
        </div>

        <div className="booking-card-info-grid">
          <div>
            <p className="booking-card-info-label">Pickup</p>
            <p className="booking-card-address">{booking.pickup.addressLine}</p>
            <p className="booking-card-info-secondary">{formatDateTime(booking.pickupAt)}</p>
          </div>
          <div>
            <p className="booking-card-info-label">Drop-off</p>
            <p className="booking-card-address">{booking.dropoff.addressLine}</p>
            <p className="booking-card-info-secondary">{formatDateTime(booking.dropAt)}</p>
          </div>
        </div>

        <div className="booking-card-total-section">
          <div className="booking-card-total-wrapper">
            <div>
              <p className="booking-card-info-label">Total Amount</p>
              <p className="booking-card-total-amount">
                {formatCurrency(booking.totals.grandTotal, booking.currency)}
              </p>
            </div>
            <div className="booking-card-breakdown">
              <p className="booking-card-breakdown-item">Subtotal: {formatCurrency(booking.totals.subTotal, booking.currency)}</p>
              <p className="booking-card-breakdown-item">Tax: {formatCurrency(booking.totals.taxTotal, booking.currency)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorBookings;
