// src/pages/bookings/BookingDetails.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingById } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Car,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const paymentStatusStyles: Record<string, { bg: string; text: string }> = {
  PENDING: {
    bg: 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700',
    text: 'text-amber-600 dark:text-amber-400',
  },
  UNPAID: {
    bg: 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700',
    text: 'text-amber-600 dark:text-amber-400',
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
  const { data: booking, isLoading, isError, error } = useBookingById(bookingId);

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
        <Button variant="ghost" onClick={handleBack} className="mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking List
        </Button>
        <Card className="text-center py-10 border rounded-xl bg-card">
          <p className="text-lg font-semibold mb-2 text-foreground">Unable to load booking details</p>
          <p className="text-muted-foreground mb-4">
            {(error as Error)?.message || 'Booking not found'}
          </p>
        </Card>
      </div>
    );
  }

  const paymentKey = booking.paidStatus?.toUpperCase() ?? 'PENDING';
  const paymentStyle = paymentStatusStyles[paymentKey] ?? paymentStatusStyles.PENDING;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Booking Details</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFB58424] rounded-lg text-sm font-mono text-[#0A0A0A80]">
              {booking.bookingCode}
              <button onClick={copyBookingCode} className="hover:text-orange-500 transition-colors">
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
              paymentStyle.text
            )}
          >
            <Clock className="h-4 w-4" />
            {booking.paidStatus === 'UNPAID' ? 'Pending Payment' : booking.paidStatus}
          </span>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl h-12 w-14">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl h-12 w-21">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
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
              <h2 className="text-lg font-medium text-foreground">Booking Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Booking Code</p>
                <p className="text-lg font-medium text-foreground">{booking.bookingCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Initial Date</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#F56304] text-muted-foreground" />
                  <p className="font-medium text-lg text-foreground">{formatDateTime(booking.createdAt)}</p>
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
                  <p className="font-normal text-sm text-[#1A1A1A] dark:text-emerald-300">{formatDate(booking.pickupAt)}</p>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{formatTime(booking.pickupAt)}</p>
              </div>

              {/* Drop-off Date Box */}
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
                  Drop-off Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="font-noraml text-sm text-[#1A1A1A] dark:text-orange-300">{formatDate(booking.dropAt)}</p>
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{formatTime(booking.dropAt)}</p>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F56304] dark:bg-orange-900/30 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Customer Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                <p className="font-medium text-foreground">{booking.confirmationName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Driver Name</p>
                <p className="font-medium text-foreground">{booking.driverName || '—'}</p>
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
                  <p className="font-normal text-sm text-[#1A1A1A] dark:text-orange-300">{booking.phoneNumber || '—'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Country</p>
                <p className="font-medium text-foreground">{booking.country || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Zip/Postal Code</p>
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
              <h2 className="text-lg font-semibold text-foreground">Location Information</h2>
            </div>

            {/* Departure Location */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className='bg-[#00C950] p-2 rounded-2xl'>
                  <Navigation className="h-4 w-4 text-white dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 uppercase">
                  Departure Location
                </p>
              </div>
              <p className="text-sm text-[#1A1A1A] dark:text-emerald-300 mb-4">
                {booking.pickupAddressLine || '—'}
              </p>

              <div className="space-y-3">
                <div className='bg-[#FFFFFFD9] p-3 rounded-lg'>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Address on Google Map</p>
                  <p className="text-sm text-foreground">
                    {booking.operationalLocation?.addressLine}, {booking.operationalLocation?.city},{' '}
                    {booking.operationalLocation?.state}, {booking.operationalLocation?.country}
                  </p>
                </div>
                <div className='bg-[#FFFFFFD9] p-3 rounded-lg'>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">GPS Coordinates</p>
                  <p className="text-sm font-mono text-foreground">
                    {booking.pickupLat}, {booking.pickupLng}
                  </p>
                </div>
              </div>
            </div>

            {/* Drop-off Location */}
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-[#FF802EBF] dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <div className='bg-[#FE6603] p-2 rounded-2xl'>
                  <MapPin className="h-4 w-4 text-white dark:text-orange-400" />
                </div>
                <p className="text-base font-medium text-[#F56304] dark:text-orange-300 uppercase">
                  Drop-off Location
                </p>
              </div>
              <p className="text-sm text-[#1A1A1A] dark:text-orange-300 mb-4">
                {booking.dropoffAddressLine || '—'}
              </p>

              <div className='bg-[#FFFFFFD9] p-3 rounded-lg'>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">GPS Coordinates</p>
                <p className="text-sm font-mono text-foreground">
                  {booking.dropoffLat}, {booking.dropoffLng}
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
                <p className="font-medium text-[#1A1A1A] dark:text-green-300">{booking.company?.name || '—'}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">License Type</p>
                  <p className="text-sm text-foreground">ID only</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Minimum Age</p>
                  <p className="text-sm text-foreground">21+</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Country</p>
                  <p className="text-sm text-foreground">
                    {booking.operationalLocation?.country || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Commission Rate</p>
                  <p className="text-sm text-foreground">
                    {booking.company?.settings?.effectiveCommissionRate || '0'}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Subscription Tier</p>
                  <p className="text-sm font-semibold text-foreground">
                    {booking.company?.settings?.currentTier || 'BASIC'}
                  </p>
                </div>
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
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Model</p>
                <p className="font-medium text-lg text-foreground">
                  {booking.companyCarClass?.make} {booking.companyCarClass?.model}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE] text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Passengers</p>
                  <p className="text-foreground">
                    {booking.companyCarClass?.numberOfPassengers || '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF5FF] border border-[#F3E8FF] text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Doors</p>
                  <p className="text-foreground">
                    {booking.companyCarClass?.numberOfDoors || '—'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card className="bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6 p-6 bg-[#FF802E] rounded-t-xl">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#FF802E]" /> 
              </div>
              <h2 className="text-lg text-white font-semibold">Pricing Summary</h2> 
            </div>

            <div className="space-y-4 m-6">
              <div className="flex items-center justify-between pb-6 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-200 flex items-center justify-center"> 
                    <Receipt className="h-4 w-4 text-blue-700" /> 
                  </div>
                  <div>
                    <p className="text-sm">Subtotal</p>
                    <p className="text-xs text-muted-foreground">Base price</p>
                  </div>
                </div>
                <p>{formatCurrency(booking.subTotal)}</p>
              </div>

              <div className="flex items-center justify-between pb-6 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] flex items-center justify-center"> 
                    <Percent className="h-4 w-4 text-[#E17100]" /> 
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tax & Fees</p>
                    <p className="text-xs text-muted-foreground">6.5% applied</p>
                  </div>
                </div>
                <p>{formatCurrency(booking.taxTotal)}</p>
              </div>

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
                  <p className="text-3xl font-semibold text-white">{formatCurrency(booking.grandTotal)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;