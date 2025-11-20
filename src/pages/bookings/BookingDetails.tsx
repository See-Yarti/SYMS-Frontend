// src/pages/bookings/BookingDetails.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingById } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoadingSkeleton } from '@/components/ui/loading';
import { ArrowLeft, Calendar, MapPin, Car, User, Phone, Mail, DollarSign, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SCHEDULED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
};

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '—';
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

const formatDateTime = (value: string) => {
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

const BookingDetails: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, isError, error } = useBookingById(bookingId);

  if (isLoading) return <PageLoadingSkeleton />;

  const handleBack = () => {
    // Navigate back to previous page in history
    navigate(-1);
  };

  if (isError || !booking) {
    return (
      <div className="p-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="error-state-card text-center py-10 border rounded-lg">
          <p className="text-lg font-semibold mb-2">Unable to load booking details</p>
          <p className="text-muted-foreground mb-4">
            {(error as Error)?.message || 'Booking not found'}
          </p>
        </div>
      </div>
    );
  }

  const statusKey = booking.status?.toUpperCase() ?? 'PENDING';
  const statusClass = statusStyles[statusKey] ?? 'bg-slate-200 text-slate-700';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Booking Details</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {booking.bookingCode}
            </p>
          </div>
        </div>
        <Badge className={cn(statusClass, 'text-sm px-3 py-1')}>
          {booking.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Code</p>
                  <p className="font-semibold font-mono">{booking.bookingCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-semibold">{formatDateTime(booking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Date</p>
                  <p className="font-semibold">{formatDateTime(booking.pickupAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drop-off Date</p>
                  <p className="font-semibold">{formatDateTime(booking.dropAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant="outline" className="mt-1">
                    {booking.paidStatus}
                  </Badge>
                </div>
                {booking.cancelledAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled At</p>
                    <p className="font-semibold">{formatDateTime(booking.cancelledAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{booking.confirmationName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Driver Name</p>
                  <p className="font-semibold">{booking.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-semibold">{booking.confirmationEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </p>
                  <p className="font-semibold">{booking.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-semibold">{booking.country}</p>
                </div>
                {booking.airline && (
                  <div>
                    <p className="text-sm text-muted-foreground">Airline</p>
                    <p className="font-semibold">{booking.airline}</p>
                  </div>
                )}
                {booking.flightNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Flight Number</p>
                    <p className="font-semibold">{booking.flightNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Operational Location</p>
                <p className="font-semibold">
                  {booking.operationalLocation.addressLine}, {booking.operationalLocation.city}, {booking.operationalLocation.state}, {booking.operationalLocation.country}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Pickup Location</p>
                <p className="font-semibold">{booking.pickupAddressLine}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {booking.pickupLat}, {booking.pickupLng}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Drop-off Location</p>
                <p className="font-semibold">{booking.dropoffAddressLine}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {booking.dropoffLat}, {booking.dropoffLng}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {booking.cancelledAt && (
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.cancellationReason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="font-semibold">{booking.cancellationReason}</p>
                  </div>
                )}
                {booking.cancelledBy && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled By</p>
                    <p className="font-semibold">{booking.cancelledBy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-semibold">{booking.company.name}</p>
              </div>
              {booking.company.logo && (
                <div>
                  <img
                    src={booking.company.logo}
                    alt={booking.company.name}
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="font-semibold">{booking.company.settings.effectiveCommissionRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription Tier</p>
                <Badge variant="outline" className="mt-1">
                  {booking.company.settings.currentTier}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Car Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Car Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Make & Model</p>
                <p className="font-semibold">
                  {booking.companyCarClass.make} {booking.companyCarClass.model}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="font-semibold">{booking.companyCarClass.numberOfPassengers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doors</p>
                  <p className="font-semibold">{booking.companyCarClass.numberOfDoors}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bags</p>
                  <p className="font-semibold">{booking.companyCarClass.numberOfBags}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-semibold">{formatCurrency(booking.subTotal)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Tax</p>
                <p className="font-semibold">{formatCurrency(booking.taxTotal)}</p>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-lg font-bold">{formatCurrency(booking.grandTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

