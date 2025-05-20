// src/pages/settings/profile-update/index.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateOperator } from '@/hooks/useOperatorApi';
import { useAppSelector } from '@/store';
import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  gender: z.string().min(1, 'Gender is required').optional(),
  avatar: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileUpdate() {
  const { user } = useAppSelector((state) => state.auth);
  const { mutate: updateOperator, isPending } = useUpdateOperator();

  // Add this right after the useGetCompanyOperators call
console.log('Current user:', user);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      gender: user?.gender || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
      });
    }
  }, [user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast.error('User data not available');
      return;
    }

    const payload = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      gender: values.gender,
      avatar: values.avatar && values.avatar.length > 0 ? values.avatar[0] : undefined
    };

    // Check if there are actual changes
    const hasChanges = 
      values.name !== user.name ||
      values.phoneNumber !== user.phoneNumber ||
      values.gender !== user.gender ||
      (values.avatar && values.avatar.length > 0);

    if (!hasChanges) {
      toast.info('No changes detected');
      return;
    }

    updateOperator(
      { 
        operatorId: user.id,
        payload
      },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update profile');
        },
      }
    );
  };

  if (!user) {
    return <div className="p-4">Loading user data...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Update Profile</h1>
      
      {/* Current Profile Display */}
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Update Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}