// Booking Validation Schemas
import { z } from 'zod';

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(10, { message: 'Cancellation reason must be at least 10 characters' }),
  cancelledBy: z.string().optional(),
});

export const searchBookingSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
});

export type CancelBookingFormValues = z.infer<typeof cancelBookingSchema>;
export type SearchBookingFormValues = z.infer<typeof searchBookingSchema>;
