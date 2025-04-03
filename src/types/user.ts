export type Genders = 'male' | 'female' | 'other';
export type Roles = 'controller' | 'od' | 'md' | 'c' | 'cm' | 'cwu';

export type User = {
  email: string;
  role: Roles;
  id: string;
  name: string;
  isFirstLogin: boolean;
};

export type LoginUserInitialData = {
  user: User;
  exp: number;
  unReadNotifications: number;
  readNotifications: number;
  _aT: string;
  _rT: string;
};
