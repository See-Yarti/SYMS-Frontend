import React from 'react';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CalendarClock,
  CalendarRange,
  Filter,
  RefreshCw,
  Search,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineLoader, PageLoadingSkeleton } from '@/components/ui/loading';
import { useAllBookings } from '@/hooks/useAllBookings';
import { Booking } from '@/types/booking';

const statusStyles: Record<string, string> = {
  PENDING:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  IN_PROGRESS:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SCHEDULED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
};

const formatCurrency = (
  value?: string | number | null,
  currency?: string | null,
) => {
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

const AllBookings: React.FC = () => {
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

  const { data, isLoading, isError, error, isFetching, refetch } =
    useAllBookings({
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

  if (isLoading) return <PageLoadingSkeleton />;
  if (isError)
    return (
      <div className="error-state-card text-center py-10">
        <p className="text-lg font-semibold mb-2">Unable to load bookings</p>
        <p className="text-muted-foreground mb-4">
          {(error as Error)?.message}
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">All Bookings</h1>
            <p className="text-sm text-muted-foreground">
              View and manage bookings from all companies
            </p>
          </div>
        </div>
        {/* {isFetching && <InlineLoader size="sm" message="Refreshing" />} */}
        <Button variant="outline" onClick={handleResetFilters}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reset filters
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by passenger, reference, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Date from</Label>
            <Input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
            />
          </div>
          <div>
            <Label>Date to</Label>
            <Input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
            />
          </div>
          <div>
            <Label>Sort</Label>
            <Select
              value={sortDir}
              onValueChange={(v: 'ASC' | 'DESC') => setSortDir(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">Newest first</SelectItem>
                <SelectItem value="ASC">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Per page</Label>
            <Select
              value={String(limit)}
              onValueChange={(v) => setLimit(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Bookings</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-10">
              <CalendarRange className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-lg font-semibold">No bookings found</p>
              <p className="text-muted-foreground">
                Try adjusting filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {totalPages}
            </p>
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={!canGoBack}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!canGoForward}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
  const statusKey = booking.status?.toUpperCase() ?? 'PENDING';
  const statusClass = statusStyles[statusKey] ?? 'bg-slate-200 text-slate-700';

  return (
    <div className="p-4 border rounded-lg space-y-3 hover:shadow-sm transition">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">Booking #{booking.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={cn(statusClass)}>{booking.status}</Badge>
          <Badge variant="outline">{booking.paidStatus}</Badge>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>
          {booking.car.make} {booking.car.model} –{' '}
          {booking.operationalLocation?.city}
        </p>
        <p>{formatCurrency(booking.totals.grandTotal, booking.currency)}</p>
      </div>
    </div>
  );
};

export default AllBookings;
