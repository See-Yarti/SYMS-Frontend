// Location Validation Schemas
import { z } from 'zod';

export const createLocationSchema = z.object({
  title: z
    .string()
    .min(2, { message: 'Location title must be at least 2 characters' }),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  addressLine: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters' }),
  longitude: z.string().min(1, { message: 'Longitude is required' }),
  latitude: z.string().min(1, { message: 'Latitude is required' }),
  isAirportZone: z.boolean().default(false),
});

export const updateLocationSchema = createLocationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateLocationFormValues = z.infer<typeof createLocationSchema>;
export type UpdateLocationFormValues = z.infer<typeof updateLocationSchema>;
