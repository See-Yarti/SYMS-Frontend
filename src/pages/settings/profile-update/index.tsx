// src/pages/settings/profile-update/index.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUpdateOperator, useGetUserByEmail, useUpdateAdmin } from '@/hooks/useOperatorApi';
import { useAppSelector } from '@/store';

// Validation schema
const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  gender: z.string().min(1, 'Gender is required'),
  avatar: z.any().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileUpdate() {
  const { user: authUser, otherInfo } = useAppSelector(state => state.auth);
  const email = authUser?.email || '';

  // Fetch user profile from backend via email
  const { data, isLoading, isError, refetch } = useGetUserByEmail(email);

  // Get the actual user data from the API response
  const user = data?.data?.user;

  const { mutate: updateOperator, isPending: isPendingOperator } = useUpdateOperator();
  const { mutate: updateAdmin, isPending: isPendingAdmin } = useUpdateAdmin();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      gender: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
      });
    }
  }, [user, form]);

  const onSubmit = (values: ProfileFormValues) => {
    if (!user) {
      toast.error('User data not available');
      return;
    }
    const payload = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      gender: values.gender,
      avatar: values.avatar && values.avatar.length > 0 ? values.avatar[0] : undefined,
    };

    const hasChanges =
      values.name !== user.name ||
      values.phoneNumber !== user.phoneNumber ||
      values.gender !== user.gender ||
      (values.avatar && values.avatar.length > 0);

    if (!hasChanges) {
      toast.info('No changes detected');
      return;
    }

    const commonCallbacks = {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update profile');
      },
    };

    if (user.role === 'admin') {
      // Hit admin update endpoint
      updateAdmin({ payload }, commonCallbacks);
    } else {
      // Default to operator flow
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
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const isSubmitting = isPendingOperator || isPendingAdmin;

  return (
    <div className="p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Update Profile</h1>
        <p className="text-muted-foreground text-sm">
          Keep your profile information up to date for a more secure and personalized experience.
        </p>
      </div>

      {/* Current Profile Display */}
      <div className="flex items-center gap-5 p-5 border border-border rounded-2xl bg-card shadow-sm mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-lg font-semibold">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="text-xs text-muted-foreground">Role: {formattedRole}</div>
        </div>
      </div>

      {/* Update Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Add your new phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        field.onChange(Array.from(e.target.files));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
