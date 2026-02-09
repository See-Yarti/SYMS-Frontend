// Operator Validation Schemas
import { z } from 'zod';

export const createOperatorSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z
    .string()
    .min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phoneNumber: z.string().min(10, { message: 'Invalid phone number' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  companyId: z.string().min(1, { message: 'Company is required' }),
});

export const updateOperatorSchema = createOperatorSchema.partial();

export type CreateOperatorFormValues = z.infer<typeof createOperatorSchema>;
export type UpdateOperatorFormValues = z.infer<typeof updateOperatorSchema>;
