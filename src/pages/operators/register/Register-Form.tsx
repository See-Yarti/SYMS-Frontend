// src/pages/operators/register/Register-Form.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, Building2, FileText, Mail, MapPin, Briefcase, Phone } from 'lucide-react';
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
import { Info } from 'lucide-react';
import { ArrowRight, Check } from 'lucide-react';

// Enhanced validation schema with better error messages
const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(100, 'Name is too long'),
  phone: z.string().min(1, 'Phone number is required'),
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name is too long'),
  companyEmail: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email is too long'),
  designation: z.string().min(1, 'Designation is required').max(100, 'Designation is too long'),
  vatNumber: z.instanceof(File, { message: 'VAT certificate is required' })
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
  companyAddress: z.string().min(1, 'Company address is required').max(200, 'Address is too long'),
  emirates: z.string().min(1, 'Please select an emirate'),
  tradeLicense: z.instanceof(File, { message: 'Trade license is required' })
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
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

interface RegisterFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ currentStep, setCurrentStep }) => {
  const navigate = useNavigate();
  const { mutate: uploadFile, isPending } = useUploadFile<{ success: boolean }>('/vendor/create');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    trigger,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      emirates: '',
    }
  });

  const handleRegister = (data: RegisterFormValues) => {
    const formData = new FormData();
    formData.append('name', data.name.trim());
    formData.append('phoneNumber', data.phone.trim());
    formData.append('companyName', data.companyName.trim());
    formData.append('email', data.companyEmail.trim());
    formData.append('designation', data.designation.trim());
    formData.append('companyAddress', data.companyAddress.trim());
    formData.append('state', data.emirates);

    if (data.vatNumber) {
      formData.append('taxRefNumber', data.vatNumber);
    }
    if (data.tradeLicense) {
      formData.append('tradeLicense', data.tradeLicense);
    }

    uploadFile(formData, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Operator registered successfully!', {
            description: 'The new operator account has been created.',
            action: {
              label: 'View Operators',
              onClick: () => navigate('/operators')
            }
          });
          navigate('/operators');
        } else {
          toast.error('Registration failed', {
            description: 'Please check your information and try again.'
          });
        }
      },
      onError: (error) => {
        console.error('Registration failed:', error);
        toast.error('Registration error', {
          description: error.message || 'Operator already exists or server error occurred.'
        });
      }
    });
  };

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(['name', 'phone', 'designation']);
    } else if (currentStep === 2) {
      isValid = await trigger(['companyName', 'companyEmail', 'companyAddress', 'emirates']);
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
              <Card className="border-none shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Personal Information</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your personal details
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name">Full Name</Label>
                      {errors.name && (
                        <span className="text-sm text-destructive">
                          {errors.name.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        disabled={isPending}
                        {...register('name')}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone">Phone Number</Label>
                      {errors.phone && (
                        <span className="text-sm text-destructive">
                          {errors.phone.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Controller
                        name="phone"
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
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="designation">Designation</Label>
                      {errors.designation && (
                        <span className="text-sm text-destructive">
                          {errors.designation.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="designation"
                        type="text"
                        placeholder="e.g., Operations Manager"
                        disabled={isPending}
                        {...register('designation')}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

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
              <Card className="border-none shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Company Details</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your company information
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="companyName">Company Name</Label>
                      {errors.companyName && (
                        <span className="text-sm text-destructive">
                          {errors.companyName.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Acme Corporation"
                        disabled={isPending}
                        {...register('companyName')}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      {errors.companyEmail && (
                        <span className="text-sm text-destructive">
                          {errors.companyEmail.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyEmail"
                        type="email"
                        placeholder="contact@company.com"
                        disabled={isPending}
                        {...register('companyEmail')}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="companyAddress">Company Address</Label>
                      {errors.companyAddress && (
                        <span className="text-sm text-destructive">
                          {errors.companyAddress.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyAddress"
                        type="text"
                        placeholder="123 Business Bay, Dubai, UAE"
                        disabled={isPending}
                        {...register('companyAddress')}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emirates">Emirates</Label>
                      {errors.emirates && (
                        <span className="text-sm text-destructive">
                          {errors.emirates.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Controller
                        name="emirates"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select your emirate" />
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

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
              <Card className="border-none shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Required Documents</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload the necessary documents for verification
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vatNumber">VAT Certificate</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload a clear scan of your VAT certificate (PDF, JPG, PNG)</p>
                            <p className="text-xs mt-1">Max file size: 5MB</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {errors.vatNumber && (
                      <span className="text-sm text-destructive block">
                        {errors.vatNumber.message}
                      </span>
                    )}
                    <Controller
                      control={control}
                      name="vatNumber"
                      render={({ field: { onChange } }) => (
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="vatNumber"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isPending}
                            onChange={(e) => onChange(e.target.files?.[0] || undefined)}
                            className="pl-10 cursor-pointer"
                          />
                        </div>
                      )}
                    />
                    {watch('vatNumber') && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {watch('vatNumber').name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tradeLicense">Trade License</Label>
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
                    {errors.tradeLicense && (
                      <span className="text-sm text-destructive block">
                        {errors.tradeLicense.message}
                      </span>
                    )}
                    <Controller
                      control={control}
                      name="tradeLicense"
                      render={({ field: { onChange } }) => (
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="tradeLicense"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isPending}
                            onChange={(e) => onChange(e.target.files?.[0] || undefined)}
                            className="pl-10 cursor-pointer"
                          />
                        </div>
                      )}
                    />
                    {watch('tradeLicense') && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {watch('tradeLicense').name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="min-w-[200px]"
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