// src/pages/settings/password-changes/index.tsx

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppSelector } from '@/store';
import {
  useUpdateOperatorPassword,
  useGetUserByEmail,
  useUpdateAdminPassword,
} from '@/hooks/useOperatorApi';
import { Mail, KeyRound, Key, Building, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AxiosError } from 'axios';

const PasswordChanges = () => {
  const { user: reduxUser } = useAppSelector((state) => state.auth);
  const email = reduxUser?.email || '';

  // Fetch latest user data from API
  const { data, isLoading, isError } = useGetUserByEmail(email);
  const user = data?.data?.user || reduxUser;

  const [passwordData, setPasswordData] = useState({
    previousPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );

  const { mutate: updateOperatorPassword, isPending: isUpdatingOperator } =
    useUpdateOperatorPassword();
  const { mutate: updateAdminPassword, isPending: isUpdatingAdmin } =
    useUpdateAdminPassword();

  // Password validation checks
  const passwordChecks = useMemo(() => {
    const pwd = passwordData.newPassword;
    return {
      minLength: pwd.length >= 8,
      upperLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  }, [passwordData.newPassword]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    if (!passwordData.previousPassword)
      errors.previousPassword = 'Current password is required';
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    const variables = {
      previousPassword: passwordData.previousPassword,
      newPassword: passwordData.newPassword,
    };

    const commonCallbacks = {
      onSuccess: () => {
        toast.success('Password updated successfully');
        setPasswordData({
          previousPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      onError: (error: unknown) => {
        const backendError = error as AxiosError<{
          message?: string;
          errors?: Array<{ field: string; constraints: string[] }>;
        }>;
        if (backendError.response?.data?.errors) {
          const errorMap: Record<string, string> = {};
          backendError.response.data.errors.forEach((err) => {
            errorMap[err.field] = err.constraints.join(', ');
          });
          setPasswordErrors(errorMap);
        }
        toast.error(
          backendError.response?.data?.message || 'Failed to update password'
        );
      },
    };

    if (user?.role === 'admin') {
      updateAdminPassword(variables, commonCallbacks);
    } else {
      updateOperatorPassword(variables, commonCallbacks);
    }
  };

  const handleCancel = () => {
    setPasswordData({
      previousPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
  };

  const isUpdating = isUpdatingOperator || isUpdatingAdmin;

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-muted-foreground">
        Loading user data...
      </div>
    );
  }

  if (isError && !user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-destructive">
        Failed to load user data.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-destructive">
        User not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-background p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Security - Manage your password and security preferences
        </p>
      </div>

      {/* Security Status Card */}
      <div className="bg-[#F0FDF4] dark:bg-green-950/20 rounded-2xl p-5 mb-6 border border-[#B9F8CF] dark:border-green-900/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00A63E] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-[#0D542B]">
              Your account is secure
            </h3>
            <p className="text-xs text-[#008236] font-normal">
              Last password change: 30 days ago
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-[#00A63E]" />
              <span className="text-xs text-[#008236] font-normal">
                Strong password active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Password Card */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#FE6603] flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-medium text-foreground">
            Update Password
          </h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <Label
              htmlFor="current-password"
              className="text-foreground text-sm font-normal"
            >
              Current Password
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                name="previousPassword"
                value={passwordData.previousPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                placeholder="Enter your current password"
                className={`pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] h-11 ${
                  passwordErrors.previousPassword ? 'border-destructive' : ''
                }`}
              />
            </div>
            {passwordErrors.previousPassword && (
              <p className="text-xs text-destructive mt-1.5">
                {passwordErrors.previousPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <Label
              htmlFor="new-password"
              className="text-foreground text-sm font-normal"
            >
              New Password
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                placeholder="Enter your new password"
                className={`pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] h-11 ${
                  passwordErrors.newPassword ? 'border-destructive' : ''
                }`}
              />
            </div>
            {passwordErrors.newPassword && (
              <p className="text-xs text-destructive mt-1.5">
                {passwordErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label
              htmlFor="confirm-password"
              className="text-foreground text-sm font-normal"
            >
              Confirm New Password
            </Label>
            <div className="relative mt-1.5">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                placeholder="Confirm your new password"
                className={`pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] h-11 ${
                  passwordErrors.confirmPassword ? 'border-destructive' : ''
                }`}
              />
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-destructive mt-1.5">
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-[#FFB58424] dark:bg-orange-950/20 rounded-xl p-4 border border-[#FF802EBF] dark:border-orange-900/40">
            <p className="text-sm font-normal text-foreground mb-3">
              Password must contain:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordChecks.minLength ? 'bg-[#22C55E]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-sm ${
                    passwordChecks.minLength
                      ? 'text-[#22C55E]'
                      : 'text-muted-foreground'
                  }`}
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordChecks.upperLower ? 'bg-[#22C55E]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-sm ${
                    passwordChecks.upperLower
                      ? 'text-[#22C55E]'
                      : 'text-muted-foreground'
                  }`}
                >
                  Upper & lowercase
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordChecks.hasNumber ? 'bg-[#22C55E]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-sm ${
                    passwordChecks.hasNumber
                      ? 'text-[#22C55E]'
                      : 'text-muted-foreground'
                  }`}
                >
                  At least one number
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    passwordChecks.hasSpecial ? 'bg-[#22C55E]' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-sm ${
                    passwordChecks.hasSpecial
                      ? 'text-[#22C55E]'
                      : 'text-muted-foreground'
                  }`}
                >
                  Special character
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-8 border-border/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8"
            >
              {isUpdating ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChanges;
