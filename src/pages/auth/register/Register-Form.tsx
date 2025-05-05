// src/pages/operators/register/Register-Form.tsx
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  User, Building2, FileText, Mail, MapPin, Phone,
  Info, ArrowRight, Check, Plus, Trash2, Lock
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import "react-phone-number-input/style.css";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadFile } from '@/hooks/useApi';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useDropzone } from 'react-dropzone';

// Enhanced validation schema with all required fields
const registerSchema = z.object({
  operatorName: z.string().min(1, 'Full name is required').max(100),
  operatorEmail: z.string().email('Invalid email format').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  companyName: z.string().min(1, 'Company name is required').max(100),
  companyAddress: z.object({
    addressLabel: z.string().default('Head Office'),
    street: z.string().min(1, 'Street is required'),
    apartment: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    zipCode: z.string().optional(),
    postalCode: z.string().optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
    additionalInfo: z.string().optional(),
  }),
  companyDescription: z.string().min(10, 'Description must be at least 10 characters').max(500),
  companyTaxFile: z.instanceof(File, { message: 'Tax file is required' })
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
  companyTaxNumber: z.string().min(1, 'Tax number is required'),
  companyTradeLicenseFile: z.instanceof(File, { message: 'Trade license is required' })
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
  companyTradeLicenseIssueNumber: z.string().min(1, 'License issue number is required'),
  companyTradeLicenseExpiryDate: z.date(),
  companyCitiesOfOperation: z.array(z.string().min(1, 'City is required')).min(1, 'At least one city is required'),
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

const uaeCities = [
  'Abu Dhabi', 'Al Ain', 'Dubai', 'Sharjah', 'Ajman',
  'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
  'Khalifa City', 'Reem Island', 'Yas Island',
  'Jumeirah', 'Deira', 'Bur Dubai', 'Silicon Oasis'
];

interface RegisterFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ currentStep, setCurrentStep }) => {
  const navigate = useNavigate();
  const { mutate: uploadFile, isPending } = useUploadFile<{ success: boolean }>('/company/create');
  const [cities, setCities] = useState<string[]>(['Dubai']);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    trigger,
    watch,
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      companyAddress: {
        country: 'UAE',
        state: 'Dubai',
        city: 'Dubai'
      },
      companyCitiesOfOperation: ['Dubai'],
      companyTradeLicenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  // File drop handlers
  const onTaxFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      setValue('companyTaxFile', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const onLicenseFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      setValue('companyTradeLicenseFile', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const { getRootProps: getTaxRootProps, getInputProps: getTaxInputProps, isDragActive: isTaxDragActive } =
    useDropzone({
      onDrop: onTaxFileDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.png', '.jpg', '.jpeg']
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024 // 5MB
    });

  const { getRootProps: getLicenseRootProps, getInputProps: getLicenseInputProps, isDragActive: isLicenseDragActive } =
    useDropzone({
      onDrop: onLicenseFileDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.png', '.jpg', '.jpeg']
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024 // 5MB
    });

    const handleRegister = (data: RegisterFormValues) => {
      if (data.companyCitiesOfOperation.length === 0) {
        toast.error("Please add at least one city of operation.");
        return;
      }
    
      const formData = new FormData();
    
      // Basic fields
      formData.append('operatorName', data.operatorName);
      formData.append('operatorEmail', data.operatorEmail);
      formData.append('password', data.password);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('companyName', data.companyName);
      formData.append('companyDescription', data.companyDescription);
      formData.append('companyTaxNumber', data.companyTaxNumber);
      formData.append('companyTradeLicenseIssueNumber', data.companyTradeLicenseIssueNumber);
    
      // Date format
      formData.append(
        'companyTradeLicenseExpiryDate',
        data.companyTradeLicenseExpiryDate.toISOString()
      );
    
      // Address (as JSON string)
      formData.append('companyAddress', JSON.stringify(data.companyAddress));
    
      // Cities (as MULTIPLE fields, not JSON array)
      data.companyCitiesOfOperation.forEach(city => {
        formData.append('companyCitiesOfOperation', city);
      });
    
      // File uploads
      formData.append('companyTaxFile', data.companyTaxFile);
      formData.append('companyTradeLicenseFile', data.companyTradeLicenseFile);
    
      // Debug log
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
    
      uploadFile(formData, {
        onSuccess: (response) => {
          if (response.success) {
            toast.success('Company registered successfully!');
            navigate('/operators');
          }
        },
        onError: (error) => {
          toast.error('Registration failed: ' + error.message);
        }
      });
    };

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(['operatorName', 'operatorEmail', 'password', 'phoneNumber']);
    } else if (currentStep === 2) {
      isValid = await trigger([
        'companyName',
        'companyAddress.street',
        'companyAddress.city',
        'companyAddress.state',
        'companyAddress.country',
        'companyDescription',
        'companyCitiesOfOperation'
      ]);
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.warning('Please complete all required fields', {
        description: 'Some fields are missing or contain errors.'
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const addCity = () => {
    const updatedCities = [...cities, 'Dubai']; // Default city
    setCities(updatedCities);
    setValue('companyCitiesOfOperation', updatedCities, { shouldValidate: true });
  };

  const removeCity = (index: number) => {
    const updatedCities = [...cities];
    updatedCities.splice(index, 1);
    setCities(updatedCities);
    setValue('companyCitiesOfOperation', updatedCities, { shouldValidate: true });
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Step 1: Operator Information */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sectionVariants}
            className="space-y-6"
          >
            <motion.div variants={fieldVariants}>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Operator Information</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the operator's personal details
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Operator Name */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="operatorName">Full Name</Label>
                      {errors.operatorName && (
                        <span className="text-sm text-destructive">
                          {errors.operatorName.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="operatorName"
                        type="text"
                        placeholder="John Doe"
                        disabled={isPending}
                        {...register('operatorName')}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Operator Email */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="operatorEmail">Email</Label>
                      {errors.operatorEmail && (
                        <span className="text-sm text-destructive">
                          {errors.operatorEmail.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="operatorEmail"
                        type="email"
                        placeholder="operator@company.com"
                        disabled={isPending}
                        {...register('operatorEmail')}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {errors.password && (
                        <span className="text-sm text-destructive">
                          {errors.password.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password@123"
                        disabled={isPending}
                        {...register('password')}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must contain uppercase, special character, and be at least 8 characters
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      {errors.phoneNumber && (
                        <span className="text-sm text-destructive">
                          {errors.phoneNumber.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Controller
                        name="phoneNumber"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            {...field}
                            international
                            defaultCountry="AE"
                            withCountryCallingCode
                            onChange={field.onChange}
                            value={field.value}
                            placeholder="+971 50 123 4567"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                          />
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Company Information */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sectionVariants}
            className="space-y-6"
          >
            <motion.div variants={fieldVariants}>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Company Information</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your company details
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      {errors.companyName && (
                        <span className="text-sm text-destructive">
                          {errors.companyName.message}
                        </span>
                      )}
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Acme Corporation"
                        disabled={isPending}
                        {...register('companyName')}
                      />
                    </div>

                    {/* Company Description */}
                    <div className="space-y-2">
                      <Label htmlFor="companyDescription">Company Description</Label>
                      {errors.companyDescription && (
                        <span className="text-sm text-destructive">
                          {errors.companyDescription.message}
                        </span>
                      )}
                      <Textarea
                        id="companyDescription"
                        placeholder="Brief description of your company..."
                        disabled={isPending}
                        {...register('companyDescription')}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Company Address */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Company Address
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Street */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress.street">Street</Label>
                        {errors.companyAddress?.street && (
                          <span className="text-sm text-destructive">
                            {errors.companyAddress.street.message}
                          </span>
                        )}
                        <Input
                          id="companyAddress.street"
                          placeholder="Sheikh Zayed Road"
                          disabled={isPending}
                          {...register('companyAddress.street')}
                        />
                      </div>

                      {/* Apartment/Office */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress.apartment">Apartment/Office</Label>
                        <Input
                          id="companyAddress.apartment"
                          placeholder="Office 502"
                          disabled={isPending}
                          {...register('companyAddress.apartment')}
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress.city">City</Label>
                        {errors.companyAddress?.city && (
                          <span className="text-sm text-destructive">
                            {errors.companyAddress.city.message}
                          </span>
                        )}
                        <Controller
                          name="companyAddress.city"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                              <SelectContent>
                                {uaeCities.map(city => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Emirate */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress.state">Emirate</Label>
                        {errors.companyAddress?.state && (
                          <span className="text-sm text-destructive">
                            {errors.companyAddress.state.message}
                          </span>
                        )}
                        <Controller
                          name="companyAddress.state"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select emirate" />
                              </SelectTrigger>
                              <SelectContent>
                                {emiratesList.map((emirateItem) => (
                                  <SelectItem key={emirateItem} value={emirateItem}>
                                    {emirateItem}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Country */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress.country">Country</Label>
                        <Input
                          id="companyAddress.country"
                          value="UAE"
                          disabled
                          {...register('companyAddress.country')}
                        />
                      </div>

                      {/* Postal Code */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress.postalCode">Postal Code</Label>
                        <Input
                          id="companyAddress.postalCode"
                          placeholder="12345"
                          disabled={isPending}
                          {...register('companyAddress.postalCode')}
                        />
                      </div>

                      {/* Additional Info */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="companyAddress.additionalInfo">Additional Info</Label>
                        <Input
                          id="companyAddress.additionalInfo"
                          placeholder="Next to Business Bay Metro"
                          disabled={isPending}
                          {...register('companyAddress.additionalInfo')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cities of Operation */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Cities of Operation
                      </h4>
                      {errors.companyCitiesOfOperation && (
                        <span className="text-sm text-destructive">
                          {errors.companyCitiesOfOperation.message}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {cities.map((_city, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Controller
                            name={`companyCitiesOfOperation.${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const updatedCities = [...cities];
                                  updatedCities[index] = value;
                                  setCities(updatedCities);
                                  setValue('companyCitiesOfOperation', updatedCities, { shouldValidate: true });
                                }}
                                value={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                                <SelectContent>
                                  {uaeCities.map((cityItem) => (
                                    <SelectItem key={cityItem} value={cityItem}>
                                      {cityItem}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {index === cities.length - 1 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addCity}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeCity(index)}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Documents & Verification */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sectionVariants}
            className="space-y-6"
          >
            <motion.div variants={fieldVariants}>
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Documents & Verification</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload required documents for verification
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tax Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyTaxNumber">Company Tax Number</Label>
                      {errors.companyTaxNumber && (
                        <span className="text-sm text-destructive">
                          {errors.companyTaxNumber.message}
                        </span>
                      )}
                      <Input
                        id="companyTaxNumber"
                        placeholder="TRN/VAT Number"
                        disabled={isPending}
                        {...register('companyTaxNumber')}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="companyTaxFile">Tax Certificate File</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Upload a clear scan of your tax certificate (PDF, JPG, PNG)</p>
                              <p className="text-xs mt-1">Max file size: 5MB</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {errors.companyTaxFile && (
                        <span className="text-sm text-destructive block">
                          {errors.companyTaxFile.message}
                        </span>
                      )}
                      <div
                        {...getTaxRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isTaxDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
                          }`}
                      >
                        <input {...getTaxInputProps()} />
                        {watch('companyTaxFile') ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-primary mb-2" />
                            <p className="font-medium">{watch('companyTaxFile').name}</p>
                            <p className="text-sm text-muted-foreground">
                              Click to replace or drag and drop
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-primary mb-2" />
                            <p className="font-medium">
                              {isTaxDragActive ? 'Drop the file here' : 'Drag & drop tax file here'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              or click to select file (PDF, JPG, PNG)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trade License Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyTradeLicenseIssueNumber">
                        Trade License Issue Number
                      </Label>
                      {errors.companyTradeLicenseIssueNumber && (
                        <span className="text-sm text-destructive">
                          {errors.companyTradeLicenseIssueNumber.message}
                        </span>
                      )}
                      <Input
                        id="companyTradeLicenseIssueNumber"
                        placeholder="License number"
                        disabled={isPending}
                        {...register('companyTradeLicenseIssueNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyTradeLicenseExpiryDate">
                        Trade License Expiry Date
                      </Label>
                      <Controller
                        control={control}
                        name="companyTradeLicenseExpiryDate"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                fromDate={new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                  </div>

                  {/* Trade License File */}
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="companyTradeLicenseFile">Trade License File</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload a clear scan of your trade license (PDF, JPG, PNG)</p>
                            <p className="text-xs mt-1">Max file size: 5MB</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {errors.companyTradeLicenseFile && (
                      <span className="text-sm text-destructive block">
                        {errors.companyTradeLicenseFile.message}
                      </span>
                    )}
                    <div
                      {...getLicenseRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isLicenseDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
                        }`}
                    >
                      <input {...getLicenseInputProps()} />
                      {watch('companyTradeLicenseFile') ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-8 w-8 text-primary mb-2" />
                          <p className="font-medium">{watch('companyTradeLicenseFile').name}</p>
                          <p className="text-sm text-muted-foreground">
                            Click to replace or drag and drop
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <FileText className="h-8 w-8 text-primary mb-2" />
                          <p className="font-medium">
                            {isLicenseDragActive ? 'Drop the file here' : 'Drag & drop license file here'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            or click to select file (PDF, JPG, PNG)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={isPending}
            className="min-w-[120px]"
          >
            Back
          </Button>
        ) : (
          <div></div>
        )}

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={isPending}
            className="min-w-[120px]"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isPending || !isValid}
            className="min-w-[200px] bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          >
            {isPending ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Registration
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default RegisterForm;