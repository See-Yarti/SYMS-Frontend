// Company Validation Schemas
import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' }),
  tradeLicenseNumber: z
    .string()
    .min(1, { message: 'Trade license number is required' }),
  tradeLicenseExpiryDate: z
    .string()
    .min(1, { message: 'Expiry date is required' }),
});

export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters' })
    .optional(),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .optional(),
  tradeLicenseNumber: z.string().optional(),
  tradeLicenseExpiryDate: z.string().optional(),
});

export const unverifyCompanySchema = z.object({
  reason: z
    .string()
    .min(10, { message: 'Reason must be at least 10 characters' }),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormValues = z.infer<typeof updateCompanySchema>;
export type UnverifyCompanyFormValues = z.infer<typeof unverifyCompanySchema>;
