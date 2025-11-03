// src/pages/operators/OperatorBookings.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '@/hooks/useBookings';
import { useAppSelector } from '@/store';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock, CalendarRange, Filter, RefreshCw, Search, UserCircle, MoreVertical, X, CheckCircle } from 'lucide-react';
import { Booking } from '@/types/booking';
import { cn } from '@/lib/utils';
import { InlineLoader, PageLoadingSkeleton } from '@/components/ui/loading';
import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/API';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SCHEDULED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
};

export enum BookingCancelType {
  /** Full refund, no payout, no commission */
  FREE_CANCEL = 'FREE_CANCEL',
  /** Customer cancels after free period – partial refund, commission on penalty */
  LATE_CANCEL = 'LATE_CANCEL',
  /** Customer never showed up – partial refund, commission on no-show fee */
  NO_SHOW = 'NO_SHOW',
  /** Booking cancelled due to customer's fault (invalid docs, etc.) */
  CUSTOMER_FAULT = 'CUSTOMER_FAULT',
  /** Booking cancelled due to operator/company issue (vehicle unavailable, etc.) */
  OPERATOR_FAULT = 'OPERATOR_FAULT',
  /** Rental used partially – refund unused portion, commission on used portion */
  PARTIAL_USE = 'PARTIAL_USE',
}

const cancelTypeOptions = [
  { value: BookingCancelType.FREE_CANCEL, label: 'Free Cancel', description: 'Full refund, no payout, no commission' },
  { value: BookingCancelType.LATE_CANCEL, label: 'Late Cancel', description: 'Customer cancels after free period' },
  { value: BookingCancelType.NO_SHOW, label: 'No Show', description: 'Customer never showed up' },
  { value: BookingCancelType.CUSTOMER_FAULT, label: 'Customer Fault', description: 'Invalid docs, etc.' },
  { value: BookingCancelType.OPERATOR_FAULT, label: 'Operator Fault', description: 'Vehicle unavailable, etc.' },
  { value: BookingCancelType.PARTIAL_USE, label: 'Partial Use', description: 'Rental used partially' },
];



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

// Cancellation Dialog Component
const CancellationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  booking: Booking;
  companyId: string;
  onSuccess: () => void;
}> = ({ open, onClose, booking, companyId, onSuccess }) => {
  const [cancelType, setCancelType] = React.useState<BookingCancelType | ''>('');
  const [note, setNote] = React.useState('');

  const { mutate: cancelBooking, isPending } = useMutation({
    mutationFn: async (data: { cancelType: BookingCancelType; note: string }) => {
      const { data: response } = await axiosInstance.patch(
        `booking/cancel-booking/${booking.id}/${companyId}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      onSuccess();
      onClose();
      setCancelType('');
      setNote('');
    },
    onError: (error: any) => {
      console.error('Error cancelling booking:', error);
      toast.error(error?.response?.data?.message || 'Failed to cancel booking');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelType) return;
    
    cancelBooking({
      cancelType: cancelType as BookingCancelType,
      note: note.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cancelType">Cancellation Type *</Label>
            <Select value={cancelType} onValueChange={(value) => setCancelType(value as BookingCancelType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cancellation type" />
              </SelectTrigger>
              <SelectContent>
                {cancelTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="note">Cancellation Note</Label>
            <Textarea
              id="note"
              placeholder="Enter cancellation reason or notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={!cancelType || isPending}
            >
              {isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Complete Booking Dialog Component
const CompleteBookingDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  booking: Booking;
  companyId: string;
  onSuccess: () => void;
}> = ({ open, onClose, booking, companyId, onSuccess }) => {
  const [note, setNote] = React.useState('');

  const { mutate: completeBooking, isPending } = useMutation({
    mutationFn: async (data: { note?: string }) => {
      const { data: response } = await axiosInstance.patch(
        `booking/complete-booking/${booking.id}/${companyId}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      toast.success('Booking completed successfully');
      onSuccess();
      onClose();
      setNote('');
    },
    onError: (error: any) => {
      console.error('Error completing booking:', error);
      toast.error(error?.response?.data?.message || 'Failed to complete booking');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    completeBooking({
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="note">Completion Notes (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Enter any completion notes or remarks..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="default" 
              disabled={isPending}
            >
              {isPending ? 'Completing...' : 'Complete Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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

  // Only send search if it has a value (not empty string)
  const searchValue = debouncedSearch && debouncedSearch.trim() ? debouncedSearch.trim() : undefined;

  const { data, isLoading, isError, error, isFetching, refetch } = useBookings({
    search: searchValue,
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
    const errorMessage = (error as any)?.response?.data?.message || 
                         (error as Error)?.message || 
                         'An unexpected error occurred while fetching bookings.';
    const isServerError = (error as any)?.response?.status === 500;

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
              {errorMessage}
              {isServerError && (
                <div className="mt-2 text-sm">
                  This might be a temporary server issue. Please try again or contact support if the problem persists.
                </div>
              )}
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
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/70">
                      <TableHead className="font-semibold">Booking Code</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">Car</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Payment</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="text-center font-semibold w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <BookingTableRow 
                        key={booking.id} 
                        booking={booking} 
                        companyId={otherInfo?.companyId || ''} 
                        onRefetch={refetch} 
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingTableRow: React.FC<{ booking: Booking; companyId: string; onRefetch: () => void }> = ({ booking, companyId, onRefetch }) => {
  const navigate = useNavigate();
  const statusKey = booking.status?.toUpperCase() ?? 'PENDING';
  const statusClass = statusStyles[statusKey] ?? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false);

  // Only show cancel option for bookings that can be cancelled
  const canCancel = booking.status && !['CANCELLED', 'COMPLETED'].includes(booking.status.toUpperCase());
  
  // Only show complete option for bookings that can be completed
  const canComplete = booking.status && ['CONFIRMED', 'IN_PROGRESS', 'SCHEDULED'].includes(booking.status.toUpperCase());

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="font-mono text-sm">
          <button
            onClick={() => navigate(`/all-bookings/${booking.id}`)}
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            {booking.bookingCode || `#${booking.id.slice(0, 8)}`}
          </button>
        </TableCell>
        <TableCell className="text-sm">
          {formatDateTime(booking.createdAt)}
        </TableCell>
        <TableCell>
          <div className="font-medium">
            {booking.car?.make || '—'} {booking.car?.model || ''}
          </div>
          <div className="text-xs text-muted-foreground">
            {booking.car?.passengers ? `${booking.car.passengers} passengers • ${booking.car.doors} doors` : '—'}
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{booking.operationalLocation?.city || '—'}</div>
          <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={booking.operationalLocation?.addressLine || ''}>
            {booking.operationalLocation?.addressLine || '—'}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn(statusClass)}>
            {booking.status}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{booking.paidStatus}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="font-semibold">
            {formatCurrency(booking.totals?.grandTotal, booking.currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            Sub: {formatCurrency(booking.totals?.subTotal, booking.currency)}
          </div>
        </TableCell>
        <TableCell className="text-center">
          {(canCancel || canComplete) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canComplete && (
                  <DropdownMenuItem
                    onClick={() => setShowCompleteDialog(true)}
                    className="text-green-600 focus:text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Booking
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem
                    onClick={() => setShowCancelDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
      </TableRow>

      <CancellationDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        booking={booking}
        companyId={companyId}
        onSuccess={onRefetch}
      />

      <CompleteBookingDialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        booking={booking}
        companyId={companyId}
        onSuccess={onRefetch}
      />
    </>
  );
};

export default OperatorBookings;
