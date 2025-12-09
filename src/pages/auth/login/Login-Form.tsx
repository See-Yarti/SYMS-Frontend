import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LoginFormValues, loginSchema } from '@/types/auth';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store';
import { loginUser } from '@/store/features/auth.slice';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useQueryParams from '@/hooks/useQueryParams';

const LoginForm = () => {
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isLoading, SetIsLoading] = React.useState<boolean>(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryParams = useQueryParams();
  const redirectURL = queryParams.get('redirect') || '/';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const HandleCredentialLogin = async (data: LoginFormValues) => {
    SetIsLoading(true);
    const re = await dispatch(loginUser(data));
    if (re.meta.requestStatus === 'fulfilled') {
      // toast.success('Login Successful');
      SetIsLoading(false);
      navigate(redirectURL, { replace: true });
      return;
    }
    if (re.meta.requestStatus === 'rejected') {
      toast.error(re.payload as string);
      SetIsLoading(false);
      return;
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(HandleCredentialLogin)}
      className="grid gap-4 sm:gap-6"
    >
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-gray-700 text-xs sm:text-sm font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="usman@gmail.com"
          disabled={isSubmitting || isLoading}
          {...register('email')}
          className="h-10 sm:h-11 rounded-md bg-[#F9FAFB] border-[#E5E7EB] focus:ring-yellow-400 focus:border-yellow-400 text-sm sm:text-base"
        />
        {errors.email && (
          <span className="text-red-500 text-xs sm:text-sm">{errors.email.message}</span>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password" className="text-gray-700 text-xs sm:text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            {...register('password')}
            placeholder="*********"
            type={showPassword ? 'text' : 'password'}
            disabled={isSubmitting || isLoading}
            className="h-10 sm:h-11 rounded-md bg-[#F9FAFB] border-[#E5E7EB] focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 pr-10 text-sm sm:text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-3 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
            ) : (
              <EyeOffIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
            )}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        {errors.password && (
          <span className="text-red-500 text-xs sm:text-sm">{errors.password.message}</span>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full bg-[#FE6603] hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center h-10 sm:h-11 text-sm sm:text-base"
        size={'default'}
      >
        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Log In
      </Button>
    </motion.form>
  );
};

export default LoginForm;