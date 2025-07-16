import { OperatorRole, UserRole } from '@/types/auth';
import { User } from '@/types/user';

export function getUserRoles(user: User, otherInfo?: any): (UserRole | OperatorRole)[] {
  if (!user) return [];
  if (user.role === 'operator' && otherInfo?.operatorRole) {
    return [user.role, otherInfo.operatorRole];
  }
  return [user.role];
}
