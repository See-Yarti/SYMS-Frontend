// src/types/authSlice.ts:

import z from 'zod';

// Zod schema for the login credentials form
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
});

// TypeScript type inferred from the schema
export type LoginFormValues = z.infer<typeof loginSchema>;

export type UserRole = 'admin' | 'operator';
export type OperatorRole =
  | 'adminOperator'
  | 'managerOperator'
  | 'salesOperator';

export type CombinedRoles = UserRole | OperatorRole;
