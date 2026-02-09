'use client';

// src/pages/bookings/BookingDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from '@/hooks/useNextNavigation';
import {
  useBookingById,
  useCancelBooking,
  useCompleteBooking,
} from '@/hooks/useBookings';
import { useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Car,
  Shield,
  User,
  Phone,
  Mail,
  DollarSign,
  Building2,
  Clock,
  Copy,
  Share2,
  Edit,
  Navigation,
  Receipt,
  Percent,
  XCircle,
  AlertCircle,
  Check,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CancelType } from '@/types/booking';
import { getCdwCase } from '@/utils/cdw';
import { Loader2 } from 'lucide-react';

const paymentStatusStyles: Record<string, { bg: string; text: string }> = {
  PENDING: {
    bg: 'bg-[#F56304]/10 dark:bg-[#F56304]/20 border border-[#F56304]/30 dark:border-[#F56304]/50',
    text: 'text-[#F56304] dark:text-[#F56304]',
  },
  UNPAID: {
    bg: 'bg-[#F56304]/10 dark:bg-[#F56304]/20 border border-[#F56304]/30 dark:border-[#F56304]/50',
    text: 'text-[#F56304] dark:text-[#F56304]',
  },
  PAID: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  PREPAID: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  POSTPAID: {
    bg: 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
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

const BookingDetails: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookingById(bookingId);
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();

  // Get user role from Redux
  const { user, otherInfo } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelType, setCancelType] = useState<CancelType>('LATE_CANCEL');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelResponse, setCancelResponse] = useState<any>(null);

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeResponse, setCompleteResponse] = useState<any>(null);

  // Permission checks
  const hasBeenModified =
    booking?.status === 'COMPLETED' || booking?.status === 'CANCELLED';

  // Complete button visibility
  const canShowComplete = isAdmin
    ? booking?.status !== 'COMPLETED' // Admin: can complete unless already completed
    : isOperator &&
      booking?.status !== 'COMPLETED' &&
      booking?.status !== 'CANCELLED'; // Operator: only if untouched

  // Cancel button visibility
  const canShowCancel = isAdmin
    ? booking?.status !== 'CANCELLED' // Admin: can cancel unless already cancelled
    : isOperator &&
      booking?.status !== 'COMPLETED' &&
      booking?.status !== 'CANCELLED'; // Operator: only if untouched

  // Edit cancellation visibility (ADMIN ONLY)
  const canEditCancellation = isAdmin && booking?.status === 'CANCELLED';

  // Handle edit button click - open cancel dialog for cancelled bookings
  const handleEditClick = () => {
    if (booking?.status === 'CANCELLED') {
      // Pre-populate with existing cancellation data if available
      // Note: We'll need to get cancelType from booking data if available
      // For now, we'll set default and let user change it
      setCancelType('LATE_CANCEL'); // Default, user can change
      setCancelNote(booking.cancellationReason || '');
      setCancelResponse(null); // Clear previous response
      setIsCancelDialogOpen(true);
    }
  };

  // Handle complete booking - open dialog
  const handleCompleteBooking = () => {
    setCompleteResponse(null); // Clear previous response
    setIsCompleteDialogOpen(true);
  };

  // Confirm and execute complete booking
  const confirmCompleteBooking = () => {
    if (!bookingId || !booking?.company?.id) {
      toast.error('Booking or Company ID not found');
      return;
    }

    completeBooking.mutate(
      {
        bookingId,
        companyId: booking.company.id,
      },
      {
        onSuccess: (data) => {
          setCompleteResponse(data);
          toast.success('Booking completed successfully');
          refetch();
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to complete booking';
          toast.error(errorMessage);
        },
      },
    );
  };

  if (isLoading) return <PageLoadingSkeleton />;

  const handleBack = () => {
    navigate(-1);
  };

  const copyBookingCode = () => {
    if (booking?.bookingCode) {
      navigator.clipboard.writeText(booking.bookingCode);
      toast.success('Booking code copied to clipboard');
    }
  };

  if (isError || !booking) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking List
        </Button>
        <Card className="text-center py-10 border rounded-xl bg-card">
          <p className="text-lg font-semibold mb-2 text-foreground">
            Unable to load booking details
          </p>
          <p className="text-muted-foreground mb-4">
            {(error as Error)?.message || 'Booking not found'}
          </p>
        </Card>
      </div>
    );
  }

  const paymentKey = booking.paidStatus?.toUpperCase() ?? 'PENDING';
  const paymentStyle =
    paymentStatusStyles[paymentKey] ?? paymentStatusStyles.PENDING;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Booking Details
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFB58424] rounded-lg text-sm font-mono text-[#0A0A0A80]">
              {booking.bookingCode}
              <button
                onClick={copyBookingCode}
                className="hover:text-orange-500 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Sub Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm text-[#1A1A1A] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking List
        </button>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 h-12 px-3 py-1.5 text-sm font-medium rounded-xl',
              paymentStyle.bg,
              paymentStyle.text,
            )}
          >
            <Clock className="h-4 w-4" />
            {booking.paidStatus === 'UNPAID'
              ? 'Pending Payment'
              : booking.paidStatus}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl h-12 w-14"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Actions Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl h-12"
              >
                <MoreVertical className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Edit Cancellation - ADMIN ONLY */}
              {canEditCancellation && (
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Cancellation
                </DropdownMenuItem>
              )}

              {/* Complete Booking - Role-based visibility */}
              {canShowComplete && (
                <DropdownMenuItem
                  onClick={handleCompleteBooking}
                  disabled={completeBooking.isPending}
                  className="text-green-600 focus:text-green-600"
                >
                  {completeBooking.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Booking
                    </>
                  )}
                </DropdownMenuItem>
              )}

              {/* Separator before cancel option */}
              {(canShowComplete || canEditCancellation) && canShowCancel && (
                <DropdownMenuSeparator />
              )}

              {/* Cancel Booking - Role-based visibility */}
              {canShowCancel && (
                <DropdownMenuItem
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Booking
                </DropdownMenuItem>
              )}

              {/* Show message if operator already modified */}
              {isOperator &&
                hasBeenModified &&
                !canShowComplete &&
                !canShowCancel && (
                  <>
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground"
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Status already updated
                    </DropdownMenuItem>
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      Operators can only change status once
                    </p>
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#FFFFFF]" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                Booking Information
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Booking Code
                </p>
                <p className="text-lg font-medium text-foreground">
                  {booking.bookingCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Initial Date
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#F56304] text-muted-foreground" />
                  <p className="font-medium text-lg text-foreground">
                    {formatDateTime(booking.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pick-up Date Box */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                  Pick-up Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-normal text-sm text-[#1A1A1A] dark:text-emerald-300">
                    {formatDate(booking.pickupAt)}
                  </p>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatTime(booking.pickupAt)}
                </p>
              </div>

              {/* Drop-off Date Box */}
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
                  Drop-off Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="font-noraml text-sm text-[#1A1A1A] dark:text-orange-300">
                    {formatDate(booking.dropAt)}
                  </p>
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  {formatTime(booking.dropAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                Customer Information
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Name
                </p>
                <p className="font-medium text-foreground">
                  {booking.confirmationName || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Driver Name
                </p>
                <p className="font-medium text-foreground">
                  {booking.driverName || '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Email Box */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-normal text-[#6B7280] dark:text-emerald-400 uppercase tracking-wide mb-2">
                  Email Address
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-normal text-sm text-[#1A1A1A] dark:text-emerald-300 truncate">
                    {booking.confirmationEmail || '—'}
                  </p>
                </div>
              </div>

              {/* Phone Box */}
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-normal text-[#6B7280] dark:text-orange-400 uppercase tracking-wide mb-2">
                  Phone Number
                </p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="font-normal text-sm text-[#1A1A1A] dark:text-orange-300">
                    {booking.phoneNumber || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Country
                </p>
                <p className="font-medium text-foreground">
                  {booking.country || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Zip/Postal Code
                </p>
                <p className="font-medium text-foreground">—</p>
              </div>
            </div>
          </Card>

          {/* Location Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Location Information
              </h2>
            </div>

            {/* Departure Location */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#00C950] p-2 rounded-2xl">
                  <Navigation className="h-4 w-4 text-white dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 uppercase">
                  Pick-up Location
                </p>
              </div>
              <div className="bg-[#FFFFFFD9] dark:bg-background/80 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Address
                </p>
                <p className="text-sm text-foreground">
                  {booking.pickupAddressLine &&
                  !/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(
                    String(booking.pickupAddressLine).trim(),
                  )
                    ? booking.pickupAddressLine
                    : `${booking.operationalLocation?.addressLine || ''}, ${booking.operationalLocation?.city || ''}, ${booking.operationalLocation?.state || ''}, ${booking.operationalLocation?.country || ''}`
                        .replace(/^,\s*|,\s*$/g, '')
                        .trim() || '—'}
                </p>
              </div>
            </div>

            {/* Drop-off Location */}
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-[#FF802EBF] dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#FE6603] p-2 rounded-2xl">
                  <MapPin className="h-4 w-4 text-white dark:text-orange-400" />
                </div>
                <p className="text-base font-medium text-[#F56304] dark:text-orange-300 uppercase">
                  Drop-off Location
                </p>
              </div>
              <div className="bg-[#FFFFFFD9] dark:bg-background/80 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Address
                </p>
                <p className="text-sm text-foreground">
                  {booking.dropoffAddressLine &&
                  !/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(
                    String(booking.dropoffAddressLine).trim(),
                  )
                    ? booking.dropoffAddressLine
                    : `${booking.operationalLocation?.addressLine || ''}, ${booking.operationalLocation?.city || ''}, ${booking.operationalLocation?.state || ''}, ${booking.operationalLocation?.country || ''}`
                        .replace(/^,\s*|,\s*$/g, '')
                        .trim() || '—'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Company</h2>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#EDFDF4] dark:bg-green-900/20 border border-[#DCFCE7] dark:border-green-800">
                <p className="text-sm font-medium text-[#008236] dark:text-green-400 uppercase tracking-wide mb-1">
                  Company Name
                </p>
                <p className="font-medium text-[#1A1A1A] dark:text-green-300">
                  {booking.company?.name || '—'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    License Type
                  </p>
                  <p className="text-sm text-foreground">ID only</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    Minimum Age
                  </p>
                  <p className="text-sm text-foreground">21+</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    Country
                  </p>
                  <p className="text-sm text-foreground">
                    {booking.operationalLocation?.country || '—'}
                  </p>
                </div>
                {isAdmin && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                        Commission Rate
                      </p>
                      <p className="text-sm text-foreground">
                        {booking.company?.settings?.effectiveCommissionRate ||
                          '0'}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Subscription Tier
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {booking.company?.settings?.currentTier || 'BASIC'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Vehicle</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Model
                </p>
                <p className="font-medium text-lg text-foreground">
                  {booking.companyCarClass?.make}{' '}
                  {booking.companyCarClass?.model}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE] text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    Passengers
                  </p>
                  <p className="text-foreground">
                    {booking.companyCarClass?.numberOfPassengers || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF] text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    Doors
                  </p>
                  <p className="text-foreground">
                    {booking.companyCarClass?.numberOfDoors || '—'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* CDW Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-medium text-foreground">CDW</h2>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  booking?.cdwSelected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                )}
              >
                {booking?.cdwSelected ? 'Selected' : 'Not Selected'}
              </span>
            </div>

            {booking?.cdwSelected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    CDW Percentage
                  </p>
                  <p className="font-medium text-lg text-foreground">
                    {booking.cdwPercentage != null
                      ? `${booking.cdwPercentage}%`
                      : '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE] text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                      CDW Amount
                    </p>
                    <p className="text-foreground font-medium">
                      {booking.cdwAmount != null
                        ? formatCurrency(booking.cdwAmount)
                        : '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF] text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                      Operator Payout on CDW
                    </p>
                    <p className="text-foreground font-medium">
                      {formatCurrency(
                        (booking as any).accountingBreakdown
                          ?.operatorPayoutOnCdw ??
                          (booking as any).accountingRecords?.[0]
                            ?.operatorPayoutOnCdwAmount,
                      )}
                    </p>
                  </div>
                </div>
                {(() => {
                  const cdwCase = getCdwCase(booking as any);
                  if (cdwCase !== 3) return null;
                  const taxOnCdw =
                    (booking as any).cdwTaxAmount ??
                    (booking as any).cdwBreakdown?.taxOnCdwAmount;
                  if (taxOnCdw == null) return null;
                  const num =
                    typeof taxOnCdw === 'string'
                      ? parseFloat(taxOnCdw)
                      : taxOnCdw;
                  if (isNaN(num) || num === 0) return null;
                  return (
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                        Tax on CDW
                      </p>
                      <p className="font-medium text-foreground">
                        {formatCurrency(taxOnCdw)}
                      </p>
                    </div>
                  );
                })()}

                {booking.cdwOption && (booking as any).totalWithCdw != null && (
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                      Total CDW Amount
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {formatCurrency((booking as any).totalWithCdw)}
                    </p>
                  </div>
                )}

                {isAdmin &&
                  ((booking as any).accountingBreakdown
                    ?.yalaRideCommissionOnCdw ??
                    (booking as any).accountingRecords?.[0]
                      ?.yalaRideCommissionOnCdwAmount) != null && (
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                        YalaRide Commission on CDW
                      </p>
                      <p className="font-medium text-foreground">
                        {formatCurrency(
                          (booking as any).accountingBreakdown
                            ?.yalaRideCommissionOnCdw ??
                            (booking as any).accountingRecords?.[0]
                              ?.yalaRideCommissionOnCdwAmount,
                        )}
                      </p>
                    </div>
                  )}
                {booking.cdwOption && (
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                      CDW Option
                    </p>
                    <p className="text-sm text-foreground">
                      {booking.cdwOption.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  CDW was not selected for this booking
                </p>
                {(booking?.company?.settings as any)?.cdwEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    CDW available:{' '}
                    {(booking.company.settings as any).cdwMinPercentage}% –{' '}
                    {(booking.company.settings as any).cdwMaxPercentage}%
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Pricing Summary */}
          <Card className="bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6 p-6 bg-[#FF802E] rounded-t-xl">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#FF802E]" />
              </div>
              <h2 className="text-lg text-white font-semibold">
                Pricing Summary
              </h2>
            </div>

            <div className="space-y-4 m-6">
              {(() => {
                const cdwCase = getCdwCase(booking as any);
                const taxOnCdw =
                  (booking as any).cdwTaxAmount ??
                  (booking as any).cdwBreakdown?.taxOnCdwAmount;
                const taxOnCdwNum = taxOnCdw != null ? Number(taxOnCdw) : 0;
                const showTaxOnCdw =
                  cdwCase === 3 && !isNaN(taxOnCdwNum) && taxOnCdwNum > 0;

                return (
                  <>
                    {/* Subtotal (rental) */}
                    <div className="flex items-center justify-between pb-6 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-200 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm">Subtotal</p>
                          <p className="text-xs text-muted-foreground">
                            Rental base
                          </p>
                        </div>
                      </div>
                      <p>{formatCurrency(booking.subTotal)}</p>
                    </div>

                    {/* Case 1: CDW before Tax */}
                    {cdwCase === 1 && booking.cdwAmount != null && (
                      <div className="flex items-center justify-between pb-6 border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-200 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-blue-700" />
                          </div>
                          <div>
                            <p className="text-sm">CDW</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.cdwPercentage}%
                            </p>
                          </div>
                        </div>
                        <p>{formatCurrency(booking.cdwAmount)}</p>
                      </div>
                    )}

                    {/* Tax & Fees */}
                    <div className="flex items-center justify-between pb-6 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
                          <Percent className="h-4 w-4 text-[#E17100]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Tax & Fees</p>
                          <p className="text-xs text-muted-foreground">
                            {cdwCase === 1
                              ? 'Tax on rental + CDW'
                              : 'Tax on rental'}
                          </p>
                        </div>
                      </div>
                      <p>{formatCurrency(booking.taxTotal)}</p>
                    </div>

                    {/* Case 2 & 3: CDW after Tax */}
                    {(cdwCase === 2 || cdwCase === 3) &&
                      booking.cdwAmount != null && (
                        <div className="flex items-center justify-between pb-6 border-b">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-200 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="text-sm">CDW</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.cdwPercentage}%
                              </p>
                            </div>
                          </div>
                          <p>{formatCurrency(booking.cdwAmount)}</p>
                        </div>
                      )}

                    {/* Case 3 only: Tax on CDW */}
                    {showTaxOnCdw && (
                      <div className="flex items-center justify-between pb-6 border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
                            <Percent className="h-4 w-4 text-[#E17100]" />
                          </div>
                          <div>
                            <p className="text-sm">Tax on CDW</p>
                          </div>
                        </div>
                        <p>{formatCurrency(taxOnCdw)}</p>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="p-4 rounded-2xl bg-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFFFFF1A] border border-[#FFFFFF33] flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Total Amount</p>
                      <p className="text-xs text-gray-400">Final payment</p>
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-white">
                    {formatCurrency(booking.grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Taxes Breakdown */}
          {(booking as any).taxesBreakdown?.length > 0 && (
            <Card className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-medium text-foreground">
                  Taxes Breakdown
                </h2>
              </div>
              <div className="space-y-3">
                {(
                  (booking as any).taxesBreakdown as Array<{
                    name: string;
                    amount: number;
                    taxType: string;
                    percentage?: number;
                  }>
                ).map((tax, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tax.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tax.taxType === 'PERCENTAGE' && tax.percentage != null
                          ? `${tax.percentage}%`
                          : tax.taxType === 'FIXED'
                            ? 'Fixed'
                            : tax.taxType}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(tax.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Revenue Split - Operator sees their payout; Admin sees both Operator + YalaRide Commission */}
          {(() => {
            const yalaRideCommission =
              (booking as any).accountingBreakdown?.totalYalaRideCommission ??
              (booking as any).accountingRecords?.[0]?.yalaRideCommissionAmount;
            const operatorPayout =
              (booking as any).accountingBreakdown?.totalOperatorPayout ??
              (booking as any).accountingRecords?.[0]?.operatorPayoutAmount;
            if (yalaRideCommission == null && operatorPayout == null)
              return null;
            return (
              <Card className="p-6 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-medium text-foreground">
                    Booking Revenue Split
                  </h2>
                </div>
                <div
                  className={cn(
                    'grid gap-4',
                    isAdmin ? 'grid-cols-2' : 'grid-cols-1',
                  )}
                >
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                      Operator Payout
                    </p>
                    <p className="text-xl font-semibold text-foreground">
                      {operatorPayout != null
                        ? formatCurrency(operatorPayout)
                        : '—'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wide mb-1">
                        YalaRide Commission
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {yalaRideCommission != null
                          ? formatCurrency(yalaRideCommission)
                          : '—'}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {booking?.status === 'CANCELLED'
                ? 'Update Cancellation Details'
                : 'Cancel Booking'}
            </DialogTitle>
            <DialogDescription>
              {booking?.status === 'CANCELLED'
                ? 'Update the cancellation type and note. This will recalculate the accounting.'
                : 'Select the cancellation type and provide a note. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {/* Warning for operators */}
          {!cancelResponse && isOperator && booking?.status !== 'CANCELLED' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                  One-time Action
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  As an operator, you can only change the booking status once.
                  After cancelling, you won't be able to modify or complete this
                  booking.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancelType">Cancellation Type *</Label>
              <Select
                value={cancelType}
                onValueChange={(value) => setCancelType(value as CancelType)}
              >
                <SelectTrigger id="cancelType" className="mt-1">
                  <SelectValue placeholder="Select cancellation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE_CANCEL">
                    FREE_CANCEL - Full refund, no commission
                  </SelectItem>
                  <SelectItem value="LATE_CANCEL">
                    LATE_CANCEL - 15% penalty
                  </SelectItem>
                  <SelectItem value="NO_SHOW">NO_SHOW - 10% fee</SelectItem>
                  <SelectItem value="CUSTOMER_FAULT">
                    CUSTOMER_FAULT - 20% fee
                  </SelectItem>
                  <SelectItem value="OPERATOR_FAULT">
                    OPERATOR_FAULT - Full refund, configurable penalty
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cancelNote">Note (Optional)</Label>
              <Textarea
                id="cancelNote"
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="mt-1"
                rows={3}
              />
            </div>

            {cancelResponse && (
              <Card className="p-4 bg-muted border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-[#F56304]" />
                  <h3 className="font-semibold">Cancellation Accounting</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Customer Refund</p>
                      <p className="font-medium">
                        {formatCurrency(
                          cancelResponse.accounting?.customerRefund,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Operator Payout</p>
                      <p className="font-medium">
                        {formatCurrency(
                          cancelResponse.accounting?.operatorPayout,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        YalaRide Commission
                      </p>
                      <p className="font-medium">
                        {formatCurrency(
                          cancelResponse.accounting?.yalaRideCommission,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commission Amount</p>
                      <p className="font-medium">
                        {formatCurrency(
                          cancelResponse.accounting?.commissionAmount,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commission Type</p>
                      <p className="font-medium">
                        {cancelResponse.accounting?.commissionType}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commission Rate</p>
                      <p className="font-medium">
                        {cancelResponse.accounting?.commissionValue ||
                          cancelResponse.accounting?.commissionRate ||
                          '—'}
                      </p>
                    </div>
                    {cancelResponse.accounting?.commissionAmount && (
                      <div>
                        <p className="text-muted-foreground">
                          Commission Amount
                        </p>
                        <p className="font-medium">
                          {formatCurrency(
                            cancelResponse.accounting.commissionAmount,
                          )}
                        </p>
                      </div>
                    )}
                    {cancelResponse.accounting?.amountOwed &&
                      parseFloat(cancelResponse.accounting.amountOwed) > 0 && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">
                            Amount Owed to YalaRide
                          </p>
                          <p className="font-semibold text-[#F56304]">
                            {formatCurrency(
                              cancelResponse.accounting.amountOwed,
                            )}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setCancelNote('');
                setCancelResponse(null);
                // Reset to default values
                setCancelType('LATE_CANCEL');
              }}
            >
              {cancelResponse ? 'Close' : 'Cancel'}
            </Button>
            {!cancelResponse && (
              <Button
                onClick={() => {
                  if (!bookingId) return;
                  if (!booking?.company?.id) {
                    toast.error('Company ID not found in booking data');
                    return;
                  }
                  cancelBooking.mutate(
                    {
                      bookingId,
                      companyId: booking.company.id,
                      payload: {
                        cancelType,
                        note: cancelNote || undefined,
                      },
                    },
                    {
                      onSuccess: (data) => {
                        setCancelResponse(data);
                        toast.success(
                          booking?.status === 'CANCELLED'
                            ? 'Cancellation details updated successfully'
                            : 'Booking cancelled successfully',
                        );
                        refetch();
                      },
                      onError: (error: any) => {
                        const errorMessage =
                          error?.response?.data?.message ||
                          error?.message ||
                          'Failed to cancel booking';
                        toast.error(errorMessage);
                      },
                    },
                  );
                }}
                disabled={cancelBooking.isPending}
                className="bg-[#F56304] hover:bg-[#F56304]/90 text-white"
              >
                {cancelBooking.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {booking?.status === 'CANCELLED'
                      ? 'Updating...'
                      : 'Cancelling...'}
                  </>
                ) : booking?.status === 'CANCELLED' ? (
                  'Update Cancellation'
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Booking Dialog */}
      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Booking</DialogTitle>
            <DialogDescription>
              {!completeResponse
                ? 'Are you sure you want to mark this booking as completed? This will calculate the final commission and operator payout.'
                : 'Booking has been completed successfully. Here are the accounting details:'}
            </DialogDescription>
          </DialogHeader>

          {/* Warning for operators */}
          {!completeResponse && isOperator && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                  One-time Action
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  As an operator, you can only change the booking status once.
                  After completing, you won't be able to modify or cancel this
                  booking.
                </p>
              </div>
            </div>
          )}

          {completeResponse && (
            <Card className="p-4 bg-muted border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-600">
                  Completion Accounting
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-muted-foreground mb-1">
                      Commission Type
                    </p>
                    <p className="font-medium">
                      {completeResponse.accounting?.commissionType || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-muted-foreground mb-1">
                      Commission Rate
                    </p>
                    <p className="font-medium">
                      {completeResponse.accounting?.commissionValue ||
                        completeResponse.accounting?.commissionRate + '%' ||
                        '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-emerald-600 dark:text-emerald-400 mb-1 text-xs font-medium uppercase">
                      Operator Payout
                    </p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(
                        completeResponse.accounting?.operatorPayout,
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <p className="text-orange-600 dark:text-orange-400 mb-1 text-xs font-medium uppercase">
                      YalaRide Commission
                    </p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(
                        completeResponse.accounting?.yalaRideCommission,
                      )}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-xs font-medium uppercase mb-1">
                        Status
                      </p>
                      <p className="font-medium">Completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-600 dark:text-blue-400 text-xs font-medium uppercase mb-1">
                        Completed At
                      </p>
                      <p className="font-medium text-sm">
                        {formatDateTime(completeResponse.completedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCompleteDialogOpen(false);
                setCompleteResponse(null);
              }}
            >
              {completeResponse ? 'Close' : 'Cancel'}
            </Button>
            {!completeResponse && (
              <Button
                onClick={confirmCompleteBooking}
                disabled={completeBooking.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {completeBooking.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Complete
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingDetails;
