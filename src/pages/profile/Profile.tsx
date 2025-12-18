// src/pages/profile/Profile.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppSelector } from '@/store';
import { useUpdateOperatorPassword } from '@/hooks/useOperatorApi';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    previousPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const { mutate: updatePassword, isPending: isUpdatingPassword } = useUpdateOperatorPassword();

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    if (!passwordData.previousPassword) errors.previousPassword = 'Current password is required';
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
    updatePassword(
      {
        previousPassword: passwordData.previousPassword,
        newPassword: passwordData.newPassword,
      },
      {
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
        }
      }
    );
  };

  if (!user) return <div className="flex justify-center py-16 text-muted-foreground">Loading user data...</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name}&rsquo;s Profile</h1>
          <div className="text-sm text-muted-foreground font-medium">{user.email}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-xl shadow border border-border p-8 space-y-8">
        {/* Account Info */}
        <div>
          <div className="mb-1 font-semibold text-lg text-foreground">Account Information</div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label className="mb-1 text-xs">Full Name</Label>
              <div className="border rounded px-3 py-2 bg-muted text-sm">{user.name}</div>
            </div>
            <div>
              <Label className="mb-1 text-xs">Email Address</Label>
              <div className="border rounded px-3 py-2 bg-muted text-sm">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-border"></div>

        {/* Password Change */}
        <div>
          <div className="mb-1 font-semibold text-lg text-foreground">Change Password</div>
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 mt-3">
            <div>
              <Label htmlFor="current-password" className="text-xs">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                name="previousPassword"
                value={passwordData.previousPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                className={passwordErrors.previousPassword ? 'border-red-500' : ''}
              />
              {passwordErrors.previousPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.previousPassword}</p>
              )}
            </div>
            <div>
              <Label htmlFor="new-password" className="text-xs">New Password</Label>
              <Input
                id="new-password"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                minLength={8}
                className={passwordErrors.newPassword ? 'border-red-500' : ''}
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full mt-3"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
