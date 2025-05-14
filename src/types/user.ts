import { OperatorRole } from "./auth";

export type Genders = 'male' | 'female' | 'other';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator'; // More specific type
  avatar: string | null;
  isFirstLogin: boolean;
  // Optional fields that might come from API
  phoneNumber?: string;
  gender?: Genders;
  lastActivityAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  companyId?: string;
  operatorRole?: string;
};

export type LoginUserInitialData = {
  _aT: string;
  _rT: string;
  user: User;
  otherInfo?: OtherInfo | null;
  // Optional fields that might come from API
  company?: Company | null;
  exp?: number;
  unReadNotifications?: number;
  readNotifications?: number;
};

export interface Company {
  id: string;
  name: string;
  // Add other company fields as needed
}

export interface OtherInfo {
  isHeadOperator?: boolean;
  operatorRole?: OperatorRole;
  operatorId: string;
  companyId: string;
  userId: string;
}