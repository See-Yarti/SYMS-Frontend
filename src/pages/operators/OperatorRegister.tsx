import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAddOperator } from '@/hooks/useApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character');

interface BackendError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{
        field: string;
        constraits: string[];
      }>;
    };
  };
}

const OperatorRegister: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: addOperator, isPending } = useAddOperator();

  const [formData, setFormData] = useState({
    operatorName: '',
    operatorEmail: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    operatorRole: 'managerOperator' as 'adminOperator' | 'managerOperator' | 'salesOperator',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (value: 'adminOperator' | 'managerOperator' | 'salesOperator') => {
    setFormData(prev => ({ ...prev, operatorRole: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      passwordSchema.parse(formData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.password = error.errors[0].message;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Destructure to remove confirmPassword
    const { confirmPassword, ...dataToSend } = formData;
    void confirmPassword;

    addOperator(dataToSend, {
      onSuccess: () => {
        toast.success('Operator registered successfully');
        navigate('/operators');
      },
      onError: (error: unknown) => {
        console.error('Registration error:', error);

        const backendError = error as BackendError;
        if (backendError.response?.data?.errors) {
          const errorMap: Record<string, string> = {};

          backendError.response.data.errors.forEach((err) => {
            if (err.field !== 'confirmPassword') {
              errorMap[err.field] = err.constraits.join(', ');
            }
          });

          setErrors(errorMap);
        }

        toast.error(
          backendError.response?.data?.message ||
          'Failed to register operator'
        );
      },
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/operators')}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Register New Operator</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="operatorName">Full Name</Label>
            <Input
              id="operatorName"
              name="operatorName"
              value={formData.operatorName}
              onChange={handleChange}
              required
              placeholder="Enter operator's full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operatorEmail">Email</Label>
            <Input
              id="operatorEmail"
              name="operatorEmail"
              type="email"
              value={formData.operatorEmail}
              onChange={handleChange}
              required
              placeholder="Enter operator's email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="+971501234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operatorRole">Role</Label>
            <Select
              value={formData.operatorRole}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="managerOperator">Manager</SelectItem>
                <SelectItem value="salesOperator">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className={errors.password ? 'border-red-500' : ''}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Must contain: 8+ chars, 1 uppercase, 1 special character
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/operators')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Registering...' : 'Register Operator'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OperatorRegister;