'use client';

// src/pages/settings/profile-update/index.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  useUpdateOperator,
  useGetUserByEmail,
  useUpdateAdmin,
} from '@/hooks/useOperatorApi';
import { useAppSelector } from '@/store';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

// Validation schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  department: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.any().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileUpdate() {
  const { user: authUser, otherInfo } = useAppSelector((state) => state.auth);
  const email = authUser?.email || '';
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile from backend via email
  const { data, isLoading, isError, refetch } = useGetUserByEmail(email);

  // Get the actual user data from the API response
  const user = data?.data?.user;

  const { mutate: updateOperator, isPending: isPendingOperator } =
    useUpdateOperator();
  const { mutate: updateAdmin, isPending: isPendingAdmin } = useUpdateAdmin();

  // Split name into first and last
  const nameParts = user?.name?.split(' ') || [];
  const defaultFirstName = nameParts[0] || '';
  const defaultLastName = nameParts.slice(1).join(' ') || '';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      department: '',
      location: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(' ') || [];
      const userAny = user as any;
      form.reset({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phoneNumber: user.phoneNumber || '',
        department: userAny.department || 'Operations',
        location: userAny.location || 'Orlando, Florida',
        bio:
          userAny.bio ||
          'Experienced administrator managing fleet operations and customer relations.',
      });
    }
  }, [user, form]);

  const onSubmit = (values: ProfileFormValues) => {
    if (!user) {
      toast.error('User data not available');
      return;
    }
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const payload = {
      name: fullName,
      phoneNumber: values.phoneNumber,
      department: values.department,
      location: values.location,
      bio: values.bio,
      avatar:
        values.avatar && values.avatar.length > 0
          ? values.avatar[0]
          : undefined,
    };

    const commonCallbacks = {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update profile');
      },
    };

    if (user.role === 'admin') {
      updateAdmin({ payload }, commonCallbacks);
    } else {
      updateOperator({ operatorId: user.id, payload }, commonCallbacks);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        User email not found in store.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-destructive">
        Failed to load user profile
      </div>
    );
  }

  const displayRole =
    user.role === 'operator' && otherInfo?.operatorRole
      ? otherInfo.operatorRole
      : user.role;

  const formattedRole = displayRole
    .split(/(?=[A-Z])/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const isSubmitting = isPendingOperator || isPendingAdmin;

  // Get role permissions based on role
  const getRolePermissions = () => {
    if (user.role === 'admin' || displayRole === 'adminOperator') {
      return [
        'Manage Users',
        'Edit Settings',
        'View Reports',
        'Manage Bookings',
      ];
    }
    if (displayRole === 'managerOperator') {
      return ['View Reports', 'Manage Bookings', 'Edit Settings'];
    }
    if (displayRole === 'salesOperator') {
      return ['Create Bookings', 'View Reports'];
    }
    return ['View Dashboard'];
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen dark:bg-background p-3 sm:p-6">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2 sm:mt-3">
          Profile - Manage your account
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="flex flex-col w-full rounded-2xl overflow-hidden shadow-sm mb-4 sm:mb-6">
        {/* Dark Header Section */}
        <div className="bg-[#1F1F1F] dark:bg-[#EA580C] px-4 sm:px-9 py-5 sm:py-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-[#2A2A2A]">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-white text-[#F97316] text-2xl sm:text-4xl font-normal">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-medium text-white">
                  {user.name}
                </h2>
                <p className="text-[#F9FAFB] text-xs sm:text-sm">
                  {formattedRole} • {(user as any).department || 'Operations'}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 text-xs text-[#F9FAFB]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate max-w-[180px] sm:max-w-none">
                      {user.email}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {(user as any).location || 'Orlando, Florida'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#F97316] hover:bg-[#EA580C] text-xs sm:text-sm text-white px-4 sm:px-6 h-9 sm:h-11 w-full sm:w-auto"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-card p-3 sm:p-6">
          <div className="w-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 bg-[#FFB58424] border border-[#FF802EBF] p-2 sm:p-2 rounded-xl">
              <div className="p-2 sm:p-4">
                <p className="text-xs mt-2 sm:mt-4 text-muted-foreground">
                  Member Since
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <span className="font-normal text-xs sm:text-sm mt-1 text-foreground">
                    {(user as any).createdAt
                      ? new Date((user as any).createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            year: 'numeric',
                          },
                        )
                      : 'Jan 2023'}
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-4">
                <p className="text-xs mt-2 sm:mt-4 text-muted-foreground">
                  Last Login
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <span className="font-normal text-xs sm:text-sm truncate mt-1 text-foreground">
                    2 hours ago
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-4">
                <p className="text-xs mt-2 sm:mt-4 text-muted-foreground">
                  Account Status
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span>
                  <span className="font-normal text-xs sm:text-sm mt-1 text-green-600">
                    Active
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-4">
                <p className="text-xs mt-2 sm:mt-4 text-muted-foreground">
                  Verification
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#155DFC]" />
                  <span className="font-normal text-xs sm:text-sm mt-1 text-[#1447E6]">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-border/40">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FE6603] flex items-center justify-center">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-foreground">
            Personal Information
          </h3>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="First name"
                          {...field}
                          disabled={!isEditing}
                          className="pl-9 sm:pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] rounded-lg text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Last name"
                        {...field}
                        disabled={!isEditing}
                        className="bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                  Email Address
                </FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Input
                    value={user.email}
                    disabled
                    className="pl-9 sm:pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] text-sm"
                  />
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="+1 (407) 779-4604"
                          {...field}
                          disabled={!isEditing}
                          className="pl-9 sm:pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                      Department
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="Operations"
                          {...field}
                          disabled={!isEditing}
                          className="pl-9 sm:pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                      Location
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="Orlando, Florida"
                          {...field}
                          disabled={!isEditing}
                          className="pl-9 sm:pl-10 bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-xs sm:text-sm font-normal">
                    Bio
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      {...field}
                      disabled={!isEditing}
                      className="bg-[#F9FAFB] dark:bg-muted border border-[#E5E7EB] min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Role & Permissions */}
      <div className="bg-white dark:bg-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-border/40">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#F56304] flex items-center justify-center">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-foreground">
            Role & Permissions
          </h3>
        </div>

        <div className="bg-[#FFB58424] dark:bg-muted rounded-xl p-4 sm:p-5 border border-[#FF802EBF]">
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#F56304] flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-normal text-sm sm:text-base text-foreground">
                  {formattedRole === 'Admin' ? 'Administrator' : formattedRole}
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#DCFCE7] text-[#16A34A] rounded-full font-normal">
                  Full Access
                </span>
              </div>
              <p className="text-xs sm:text-sm font-normal text-muted-foreground mt-1">
                You have complete control over the system including user
                management, settings, and all data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {getRolePermissions().map((permission) => (
              <span
                key={permission}
                className="text-xs text-[#F56308] px-2 sm:px-3 py-1 sm:py-1.5 bg-white dark:bg-card border border-[#F56304] rounded-lg sm:rounded-xl text-foreground"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#FEF2F2] dark:bg-red-950/20 rounded-2xl p-4 sm:p-6 border border-[#FFC9C9] dark:border-red-900/40">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#E7000B] flex items-center justify-center">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-medium">Danger Zone</h3>
        </div>

        <div className="bg-white dark:bg-card rounded-xl p-4 sm:p-5 border border-[#FFC9C9]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="font-normal text-sm sm:text-base text-foreground">
                Deactivate Account
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Temporarily disable your account. You can reactivate it anytime.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-[#E7000B] rounded-lg sm:rounded-xl text-[#E7000B] hover:bg-[#FFF7ED] hover:text-[#EA580C] w-full sm:w-auto"
            >
              Deactivate
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Buttons - Only show when editing */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8 w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      )}
    </div>
  );
}
