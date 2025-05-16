// src/pages/profile/Profile.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppSelector } from '@/store';
import { useUpdateOperatorPassword } from '@/hooks/useApi';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);

  // State for password change
  const [passwordData, setPasswordData] = useState({
    previousPassword: '',
    newPassword: '',
    confirmPassword: ''
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

    if (!passwordData.previousPassword) {
      errors.previousPassword = 'Current password is required';
    }

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

    if (!validatePasswordForm()) {
      return;
    }

    updatePassword(
      {
        previousPassword: passwordData.previousPassword,
        newPassword: passwordData.newPassword
      },
      {
        onSuccess: () => {
          toast.success('Password updated successfully');
          setPasswordData({
            previousPassword: '',
            newPassword: '',
            confirmPassword: ''
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

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {user.name}'s Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Password Change Section */}
        <div className="space-y-6 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                name="previousPassword"
                value={passwordData.previousPassword}
                onChange={handlePasswordChange}
                required
                className={passwordErrors.previousPassword ? 'border-red-500' : ''}
              />
              {passwordErrors.previousPassword && (
                <p className="text-sm text-red-500">{passwordErrors.previousPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className={passwordErrors.newPassword ? 'border-red-500' : ''}
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full"
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