import React from 'react';
import { useDebounce } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  RefreshCw,
  Search,
  CalendarRange,
  CheckCircle2,
  Loader2,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllBookings } from '@/hooks/useAllBookings';
import { useGetCompanies } from '@/hooks/useCompanyApi';

const statusStyles: Record<string, { bg: string; text: string; icon?: React.ReactNode; label: string }> = {
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

const formatCurrency = (value: string | number | undefined) => {
  if (value === undefined || value === null) return '$0.00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(numValue);
  } catch {
    return `$${numValue.toFixed(2)}`;
  }
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
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const AllBookings: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortDir, setSortDir] = React.useState<'ASC' | 'DESC'>('DESC');
  const [limit, setLimit] = React.useState(10);
  const [page, setPage] = React.useState(1);
  const [dateFromInput, setDateFromInput] = React.useState('');
  const [dateToInput, setDateToInput] = React.useState('');
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>('all');

  const [debouncedSearch] = useDebounce(searchTerm, 400);

  // Fetch companies for dropdown
  const { data: companiesData } = useGetCompanies({
    limit: 1000,
    page: 1,
  });

  const companies = companiesData?.data?.companies ?? [];

  const dateFromIso = React.useMemo(() => {
    if (!dateFromInput) return undefined;
    return new Date(`${dateFromInput}T00:00:00.000Z`).toISOString();
  }, [dateFromInput]);

  const dateToIso = React.useMemo(() => {
    if (!dateToInput) return undefined;
    return new Date(`${dateToInput}T23:59:59.999Z`).toISOString();
  }, [dateToInput]);

  const { data, isLoading, isError, error, refetch } = useAllBookings({
    search: debouncedSearch || undefined,
    sortDir,
    dateFrom: dateFromIso,
    dateTo: dateToIso,
    companyId: selectedCompanyId && selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
    page,
    limit,
  });

  // Stats data - fetch all bookings for stats (max limit 100 as per server validation)
  const { data: statsData } = useAllBookings({
    page: 1,
    limit: 100,
  });

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortDir, dateFromIso, dateToIso, selectedCompanyId, limit]);

  const bookings = data?.bookings ?? [];
  const meta = data?.meta ?? { ok: true, page: 1, limit, total: 0 };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  // Calculate stats
  const stats = React.useMemo(() => {
    const allBookings = bookings;
    const totalBookings = meta.total;

    const activeRentals = allBookings.filter(
      (b: any) => b.status === 'IN_PROGRESS' || b.status === 'CONFIRMED'
    ).length;

    const pendingPayment = allBookings.filter(
      (b: any) => b.paidStatus === 'UNPAID' || b.paidStatus === 'PENDING'
    ).length;

    const revenue = allBookings.reduce((sum: number, b: any) => {
      const total = parseFloat(b.totals?.grandTotal || '0');
      return sum + (isNaN(total) ? 0 : total);
    }, 0);

    return {
      totalBookings,
      activeRentals,
      pendingPayment,
      revenue,
    };
  }, [bookings, meta.total]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortDir('DESC');
    setLimit(10);
    setPage(1);
    setDateFromInput('');
    setDateToInput('');
    setSelectedCompanyId('all');
  };

  const canGoBack = page > 1;
  const canGoForward = page < totalPages && bookings.length === limit;

  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-2 text-foreground">Unable to load bookings</p>
          <p className="text-muted-foreground mb-4">{(error as Error)?.message}</p>
          <Button onClick={() => refetch()} className="bg-orange-500 hover:bg-orange-600">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 min-h-screen ">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">All Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage bookings from all companies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Bookings */}
        <Card className="p-5 bg-card border border-blue-200 dark:border-blue-900/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-normal">Total Bookings</p>
              <p className="text-3xl font-medium text-foreground mt-1">
                {stats.totalBookings.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#3F2DFF] dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Active Rentals */}
        <Card className="p-5 bg-card border border-emerald-200 dark:border-emerald-900/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-normal">Active Rentals</p>
              <p className="text-3xl font-semibold text-foreground mt-1">{stats.activeRentals}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#009410] dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        {/* Pending Payment */}
        <Card className="p-5 bg-card border border-[#F56304]/30 dark:border-[#F56304]/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-normal">Pending Payment</p>
              <p className="text-3xl font-semibold text-foreground mt-1">{stats.pendingPayment}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F56304]/10 dark:bg-[#F56304]/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#F56304] dark:text-[#F56304]" />
            </div>
          </div>
        </Card>

        {/* Revenue (MTD) */}
        <Card className="p-5 bg-card border border-purple-200 dark:border-purple-900/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-normal">Revenue (MTD)</p>
              <p className="text-3xl font-semibold text-foreground mt-1">
                ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F2E8FFD9] dark:bg-purple-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#6700FF] dark:text-[#6700FF]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 space-y-4 border-b border-border">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 truncate bg-muted/50 border-border focus:bg-background"
              />
            </div>
            <Button
              onClick={handleResetFilters}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset filters
            </Button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-muted-foreground">Date from</Label>
              <Input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
                className="w-[140px] bg-muted/50 border-border"
                placeholder="mm/dd/yyyy"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-muted-foreground">Date to</Label>
              <Input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
                className="w-[140px] bg-muted/50 border-border"
                placeholder="mm/dd/yyyy"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-muted-foreground">Sort</Label>
              <Select value={sortDir} onValueChange={(v: 'ASC' | 'DESC') => setSortDir(v)}>
                <SelectTrigger className="w-[130px] bg-muted/50 border-border">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Newest first</SelectItem>
                  <SelectItem value="ASC">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-muted-foreground">Company</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-[150px] bg-muted/50 border-border">
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal text-muted-foreground">Per page</Label>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-[80px] bg-muted/50 border-border">
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
            <div className="flex-1 text-right">
              <p className="text-sm font-normal text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> of{' '}
                <span className="font-medium text-foreground">{meta.total}</span> results
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Booking Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pickup Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <CalendarRange className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-lg font-semibold text-foreground">No bookings found</p>
                    <p className="text-muted-foreground">Try adjusting filters or search terms</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusKey = booking.status?.toUpperCase() ?? 'PENDING';
                  const statusStyle = statusStyles[statusKey] ?? {
                    ...statusStyles.PENDING,
                    label: booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1).toLowerCase() || 'Pending'
                  };
                  const paymentKey = booking.paidStatus?.toUpperCase() ?? 'UNPAID';
                  const paymentStyle = paymentStyles[paymentKey] ?? paymentStyles.UNPAID;

                  return (
                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                      {/* Booking Code */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/all-bookings/${booking.id}`)}
                          className="font-semibold text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors cursor-pointer"
                        >
                          {booking.bookingCode || `#${booking.id.slice(0, 8)}`}
                        </button>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-foreground text-sm font-medium">{booking.company?.name || '—'}</span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-sm font-normal whitespace-nowrap">
                        <div className="text-foreground">{formatDate(booking.createdAt)}</div>
                        <div className="text-muted-foreground">{formatTime(booking.createdAt)}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {booking.car?.make || '—'} {booking.car?.model || ''}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {booking.car?.passengers ? `${booking.car.passengers} passengers` : '—'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            booking.operationalLocation?.isAirportZone
                              ? 'bg-blue-500'
                              : 'bg-orange-500'
                          )} />
                          <span className="text-sm font-normal text-foreground">
                            {booking.operationalLocation?.city || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Pickup Date */}
                      <td className="px-4 py-3 text-sm font-normal whitespace-nowrap">
                        <div className="text-muted-foreground">
                          {booking.pickupAt ? formatDate(booking.pickupAt) : '—'}
                        </div>
                        <div className="text-muted-foreground">
                          {booking.pickupAt ? formatTime(booking.pickupAt) : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal rounded-lg',
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          {statusStyle.icon}
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg',
                            paymentStyle.bg,
                            paymentStyle.text
                          )}
                        >
                          {booking.paidStatus?.toUpperCase()}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="font-normal text-sm text-foreground">
                          {formatCurrency(booking.totals?.grandTotal)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {bookings.length > 0 && (
          <div className="px-4 py-4 flex items-center justify-between border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{bookings.length}</span> of{' '}
              <span className="font-medium text-foreground">{meta.total}</span> bookings
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canGoBack}
                className="text-muted-foreground"
              >
                Previous
              </Button>

              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (page === 1) {
                  pageNum = i + 1;
                } else if (page === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = page - 1 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={
                      page === pageNum
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'text-muted-foreground'
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canGoForward}
                className="text-muted-foreground"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AllBookings;