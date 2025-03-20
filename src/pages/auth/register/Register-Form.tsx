import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, Phone, Home, FileText } from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import "react-phone-number-input/style.css";
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

// Define the schema for the registration form
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'), // Keep as 'phone' for the form
  companyName: z.string().min(1, 'Company Name is required'),
  companyEmail: z.string().email('Invalid company email address'), // Keep as 'companyEmail' for the form
  designation: z.string().min(1, 'Designation is required'),
  vatNumber: z.string().min(1, 'VAT Number is required'),
  companyAddress: z.string().min(1, 'Company Address is required'),
  emirates: z.string().min(1, 'Emirates is required'),
  tradeLicense: z.instanceof(File).refine(file => file.size > 0, 'Trade License is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const emiratesList = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

const RegisterForm = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
  
    const formData = new FormData();
  
    formData.append('name', data.name);
    formData.append('phoneNumber', data.phone);
    formData.append('companyName', data.companyName);
    formData.append('email', data.companyEmail);
    formData.append('designation', data.designation);
    formData.append('taxRefNumber', data.vatNumber); // Ensure this matches the backend field name
    formData.append('companyAddress', data.companyAddress);
    formData.append('state', data.emirates);
  
    if (data.tradeLicense) {
      formData.append('tradeLicense', data.tradeLicense, data.tradeLicense.name);
    }
  
    // Log FormData contents
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
  
    try {
      const response = await axios.post(
        'http://localhost:4000/api/auth/controller/vendor/register',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      if (response.status === 201) {
        toast.success('Registration Successful');
        navigate('/', { replace: true });
      } else {
        toast.error('Registration Failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration Failed');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(handleRegister)}
      className="grid gap-4"
    >

      {/* Grid layout for two fields per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="grid gap-3">
          <Label htmlFor="name" className="text-gray-700 text-sm flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-600" /> Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isSubmitting || isLoading}
            {...register('name')}
            className="focus:ring-2 focus:ring-purple-500 pl-6"
          />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* Phone Field */}
        <div className="grid gap-3">
          <Label htmlFor="phone" className="text-gray-700 text-sm flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-600" /> Phone Number
          </Label>
          <Controller
            name="phone"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <PhoneInput
                {...field}
                defaultCountry="AE" // Set default country to UAE
                international
                withCountryCallingCode
                placeholder="Enter phone number"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            )}
          />
          {errors.phone && (
            <span className="text-red-500 text-sm">{errors.phone.message}</span>
          )}
        </div>
      </div>

      {/* Grid layout for two fields per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name Field */}
        <div className="grid gap-3">
          <Label htmlFor="companyName" className="text-gray-700 text-sm flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-600" /> Company Name
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Company Name"
            disabled={isSubmitting || isLoading}
            {...register('companyName')}
            className="focus:ring-2 focus:ring-purple-500 pl-6"
          />
          {errors.companyName && (
            <span className="text-red-500 text-sm">{errors.companyName.message}</span>
          )}
        </div>

        {/* Company Email Field */}
        <div className="grid gap-3">
          <Label htmlFor="companyEmail" className="text-gray-700 text-sm flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-600" /> Company Email
          </Label>
          <Input
            id="companyEmail"
            type="email"
            placeholder="company@example.com"
            disabled={isSubmitting || isLoading}
            {...register('companyEmail')}
            className="focus:ring-2 focus:ring-purple-500 pl-6"
          />
          {errors.companyEmail && (
            <span className="text-red-500 text-sm">{errors.companyEmail.message}</span>
          )}
        </div>
      </div>

      {/* Grid layout for two fields per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Designation Field */}
        <div className="grid gap-3">
          <Label htmlFor="designation" className="text-gray-700 text-sm flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-600" /> Designation
          </Label>
          <Input
            id="designation"
            type="text"
            placeholder="Designation"
            disabled={isSubmitting || isLoading}
            {...register('designation')}
            className="focus:ring-2 focus:ring-purple-500 pl-6"
          />
          {errors.designation && (
            <span className="text-red-500 text-sm">{errors.designation.message}</span>
          )}
        </div>

        {/* VAT Number Field */}
        <div className="grid gap-3">
          <Label htmlFor="vatNumber" className="text-gray-700 text-sm flex items-center">
            <FileText className="h-4 w-4 mr-2 text-gray-600" /> VAT Number
          </Label>
          <Input
            id="vatNumber"
            type="text"
            placeholder="VAT123456"
            disabled={isSubmitting || isLoading}
            {...register('vatNumber')}
            className="focus:ring-2 focus:ring-purple-500 pl-6"
          />
          {errors.vatNumber && (
            <span className="text-red-500 text-sm">{errors.vatNumber.message}</span>
          )}
        </div>
      </div>

      {/* Company Address Field */}
      <div className="grid gap-3">
        <Label htmlFor="companyAddress" className="text-gray-700 text-sm flex items-center">
          <Home className="h-4 w-4 mr-2 text-gray-600" /> Company Address
        </Label>
        <Input
          id="companyAddress"
          type="text"
          placeholder="Company Address"
          disabled={isSubmitting || isLoading}
          {...register('companyAddress')}
          className="focus:ring-2 focus:ring-purple-500 pl-6"
        />
        {errors.companyAddress && (
          <span className="text-red-500 text-sm">{errors.companyAddress.message}</span>
        )}
      </div>

      {/* Emirates Field */}
      <div className="grid gap-3">
        <Label htmlFor="emirates" className="text-gray-700 text-sm flex items-center">
          <Home className="h-4 w-4 mr-2 text-gray-600" /> Emirates
        </Label>
        <Controller
          name="emirates"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="focus:ring-1 focus:ring-gray-700 pl-6">
                <SelectValue placeholder="Select Emirates" />
              </SelectTrigger>
              <SelectContent>
                {emiratesList.map((emirate) => (
                  <SelectItem key={emirate} value={emirate}>
                    {emirate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.emirates && (
          <span className="text-red-500 text-sm">{errors.emirates.message}</span>
        )}
      </div>

      {/* Trade License Field */}
      {/* Trade License Field */}
<div className="grid gap-3">
  <Label htmlFor="tradeLicense" className="text-gray-700 text-sm flex items-center">
    <FileText className="h-4 w-4 mr-2 text-gray-600" /> Trade License
  </Label>
  <Controller
    control={control}
    name="tradeLicense"
    defaultValue={undefined}
    render={({ field: { onChange } }) => (
      <Input
        id="tradeLicense"
        type="file"
        accept=".pdf,image/*"
        disabled={isSubmitting || isLoading}
        onChange={(e) => onChange(e.target.files?.[0] || undefined)}
        className="focus:ring-1 focus:ring-gray-700 pl-6"
      />
    )}
  />
  {errors.tradeLicense && (
    <span className="text-red-500 text-sm">{errors.tradeLicense.message}</span>
  )}
</div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-semibold py-2 rounded-lg transition-all duration-300 flex items-center justify-center"
        size={'sm'}
      >
        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Register
      </Button>
    </motion.form>
  );
};

export default RegisterForm;
