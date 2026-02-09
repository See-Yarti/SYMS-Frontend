'use client';

// src/pages/company/CompanyForm.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  User,
  Building2,
  FileText,
  Mail,
  MapPin,
  Info,
  Check,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Building,
  Calendar as CalendarIcon,
  Hash,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Save,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useNavigate, useParams, useLocation } from '@/hooks/useNextNavigation';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Country, State, City } from 'country-state-city';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadFile } from '@/hooks/useApi';
import {
  useCheckCompanyKey,
  useSuggestCompanyKeys,
  useGetCompany,
  useUpdateCompany,
} from '@/hooks/useCompanyApi';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Form schema for create mode
const createSchema = z
  .object({
    operatorName: z
      .string()
      .min(1, { message: 'Full name is required' })
      .max(100, { message: 'Name must be less than 100 characters' }),
    operatorEmail: z
      .string()
      .email({ message: 'Please enter a valid email address' })
      .max(100, { message: 'Email must be less than 100 characters' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
      .regex(/[0-9]/, { message: 'Must contain at least one number' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Must contain at least one special character',
      }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirm Password is required' }),
    phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
    companyName: z
      .string()
      .min(1, { message: 'Company name is required' })
      .max(100, { message: 'Company name must be less than 100 characters' }),
    companyKey: z
      .string()
      .min(2, { message: 'Company key must be at least 2 characters' })
      .max(3, { message: 'Company key must be at most 3 characters' })
      .regex(/^[A-Z]+$/, {
        message:
          'Company key must contain only uppercase alphabets (A-Z), no numbers or special characters',
      }),
    companyAddress: z.object({
      addressLabel: z.string().default('Head Office'),
      street: z.string().min(1, { message: 'Street address is required' }),
      apartment: z.string().optional(),
      city: z.string().min(1, { message: 'City is required' }),
      state: z.string().min(1, { message: 'State/Region is required' }),
      country: z.string().min(1, { message: 'Country is required' }),
      postalCode: z.string().optional(),
      additionalInfo: z.string().optional(),
    }),
    companyDescription: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters' })
      .max(500, { message: 'Description must be less than 500 characters' }),
    companyTaxFile: z
      .instanceof(File, { message: 'Tax file is required' })
      .refine(
        (file) => file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      ),
    companyTaxNumber: z.string().min(1, { message: 'Tax number is required' }),
    companyTradeLicenseFile: z
      .instanceof(File, { message: 'Trade license is required' })
      .refine(
        (file) => file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      ),
    companyTradeLicenseIssueNumber: z
      .string()
      .min(1, { message: 'License issue number is required' }),
    companyTradeLicenseExpiryDate: z.date({
      required_error: 'Expiry date is required',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Form schema for edit mode (files are optional, passwords are optional)
const editSchema = z
  .object({
    operatorName: z
      .string()
      .min(1, { message: 'Full name is required' })
      .max(100, { message: 'Name must be less than 100 characters' }),
    operatorEmail: z
      .string()
      .email({ message: 'Please enter a valid email address' })
      .max(100, { message: 'Email must be less than 100 characters' }),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, {
        message: 'Password must be at least 8 characters',
      })
      .refine((val) => !val || /[A-Z]/.test(val), {
        message: 'Must contain at least one uppercase letter',
      })
      .refine((val) => !val || /[0-9]/.test(val), {
        message: 'Must contain at least one number',
      })
      .refine((val) => !val || /[^a-zA-Z0-9]/.test(val), {
        message: 'Must contain at least one special character',
      }),
    confirmPassword: z.string().optional(),
    phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
    companyName: z
      .string()
      .min(1, { message: 'Company name is required' })
      .max(100, { message: 'Company name must be less than 100 characters' }),
    companyKey: z
      .string()
      .min(2, { message: 'Company key must be at least 2 characters' })
      .max(3, { message: 'Company key must be at most 3 characters' })
      .regex(/^[A-Z]+$/, {
        message:
          'Company key must contain only uppercase alphabets (A-Z), no numbers or special characters',
      }),
    companyAddress: z.object({
      addressLabel: z.string().default('Head Office'),
      street: z.string().min(1, { message: 'Street address is required' }),
      apartment: z.string().optional(),
      city: z.string().min(1, { message: 'City is required' }),
      state: z.string().min(1, { message: 'State/Region is required' }),
      country: z.string().min(1, { message: 'Country is required' }),
      postalCode: z.string().optional(),
      additionalInfo: z.string().optional(),
    }),
    companyDescription: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters' })
      .max(500, { message: 'Description must be less than 500 characters' }),
    companyTaxFile: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      ),
    companyTaxNumber: z.string().min(1, { message: 'Tax number is required' }),
    companyTradeLicenseFile: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        'File size must be less than 5MB',
      ),
    companyTradeLicenseIssueNumber: z
      .string()
      .min(1, { message: 'License issue number is required' }),
    companyTradeLicenseExpiryDate: z.date({
      required_error: 'Expiry date is required',
    }),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type RegisterFormValues = CreateFormValues | EditFormValues;
type CountryType = ReturnType<typeof Country.getAllCountries>[number];

// Step configuration
const STEPS = [
  { id: 1, title: 'Operator Info', icon: User },
  { id: 2, title: 'Company Info', icon: Building2 },
  { id: 3, title: 'Address', icon: MapPin },
  { id: 4, title: 'Documents', icon: FileText },
];

const CompanyForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId } = useParams<{ companyId: string }>();
  // Check if we're on edit route - more reliable than just checking companyId
  const isEditMode = !!companyId && location.pathname.includes('/edit');

  const { mutate: uploadFile, isPending: isCreating } = useUploadFile<{
    message: any;
    success: boolean;
  }>('/company/create');
  const updateCompany = useUpdateCompany();
  const isPending = isCreating || updateCompany.isPending;

  const { data: companyData, isLoading: isLoadingCompany } = useGetCompany(
    companyId || '',
  );

  // Initialize step - start at step 1 for both create and edit mode
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const countryList: CountryType[] = Country.getAllCountries();
  const { mutate: getSuggestions, isPending: isSuggesting } =
    useSuggestCompanyKeys();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(isEditMode ? editSchema : createSchema),
    mode: 'onChange',
    defaultValues: {
      companyKey: '',
      companyName: '',
      operatorName: '',
      operatorEmail: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      companyDescription: '',
      companyTaxNumber: '',
      companyTradeLicenseIssueNumber: '',
      companyAddress: {
        addressLabel: 'Head Office',
        street: '',
        apartment: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        additionalInfo: '',
      },
      companyTradeLicenseExpiryDate: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      ),
    },
  });

  // Populate form when company data is loaded in edit mode
  useEffect(() => {
    if (isEditMode && companyData?.data?.company) {
      const company = companyData.data.company;
      const address = company.addresses?.[0]; // Get first address
      const operator = company.operators?.[0]; // Get first operator

      // Populate operator info
      if (operator?.user) {
        setValue('operatorName', operator.user.name || '');
        setValue('operatorEmail', operator.user.email || '');
        setValue('phoneNumber', operator.user.phoneNumber || '');
      }

      // Populate company info
      setValue('companyName', company.name || '');
      // Get companyKey from company object (it might be stored as companyKey, key, or company_key)
      const companyKeyValue =
        (company as any).companyKey ||
        (company as any).key ||
        (company as any).company_key ||
        '';
      if (companyKeyValue) {
        setValue('companyKey', companyKeyValue);
      }
      setValue('companyDescription', company.description || '');
      setValue('companyTaxNumber', company.taxNumber || '');
      setValue(
        'companyTradeLicenseIssueNumber',
        company.tradeLicenseIssueNumber || '',
      );

      if (company.tradeLicenseExpiryDate) {
        setValue(
          'companyTradeLicenseExpiryDate',
          new Date(company.tradeLicenseExpiryDate),
        );
      }

      // Note: We don't populate file fields in edit mode
      // Files are only sent if user uploads new ones (File objects)
      // This prevents backend from trying to delete existing files

      // Populate address info
      if (address) {
        setValue(
          'companyAddress.addressLabel',
          address.addressLabel || 'Head Office',
        );
        setValue('companyAddress.street', address.street || '');
        setValue('companyAddress.apartment', address.apartment || '');
        setValue('companyAddress.city', address.city || '');
        setValue('companyAddress.state', address.state || '');
        setValue('companyAddress.country', address.country || '');
        setValue(
          'companyAddress.postalCode',
          address.postalCode || address.zipCode || '',
        );
        setValue('companyAddress.additionalInfo', address.additionalInfo || '');
      }
    }
  }, [isEditMode, companyData, setValue]);

  const selectedCountry = watch('companyAddress.country');
  const selectedState = watch('companyAddress.state');
  const companyKey = watch('companyKey') || '';
  const companyName = watch('companyName') || '';

  // Check company key availability
  const { data: keyCheckData, isLoading: isCheckingKey } = useCheckCompanyKey(
    companyKey.length >= 2 ? companyKey : '',
  );

  // Clear state and city when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = State.getStatesOfCountry(selectedCountry);
      const currentState = getValues('companyAddress.state');
      if (currentState && !states.find((s) => s.isoCode === currentState)) {
        setValue('companyAddress.state', '', { shouldValidate: false });
        setValue('companyAddress.city', '', { shouldValidate: false });
      }
    } else {
      setValue('companyAddress.state', '', { shouldValidate: false });
      setValue('companyAddress.city', '', { shouldValidate: false });
    }
  }, [selectedCountry, setValue, getValues]);

  // Auto-set city when no cities available
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const cities = City.getCitiesOfState(selectedCountry, selectedState);
      if (cities.length === 0) {
        const states = State.getStatesOfCountry(selectedCountry);
        const currentState = states.find((s) => s.isoCode === selectedState);
        if (currentState) {
          setValue('companyAddress.city', currentState.name, {
            shouldValidate: true,
          });
        }
      } else {
        const states = State.getStatesOfCountry(selectedCountry);
        const stateNames = states.map((s) => s.name);
        const currentCity = getValues('companyAddress.city');
        if (
          currentCity &&
          stateNames.includes(currentCity) &&
          !cities.find((c) => c.name === currentCity)
        ) {
          setValue('companyAddress.city', '', { shouldValidate: false });
        }
      }
    } else if (selectedCountry && !selectedState) {
      setValue('companyAddress.city', '', { shouldValidate: false });
    }
  }, [selectedCountry, selectedState, setValue, getValues]);

  // Generate company key from company name
  const generateCompanyKey = useCallback(() => {
    if (!companyName || companyName.trim().length === 0) {
      toast.error('Please enter a company name first');
      return;
    }

    getSuggestions(
      { name: companyName.trim() },
      {
        onSuccess: (response) => {
          // Response structure: { suggestions: [...] }
          const suggestionsList = response?.suggestions || [];
          if (suggestionsList.length > 0) {
            // Auto-select first suggestion (2-3 uppercase letters only, no year/hyphen)
            const newKey = suggestionsList[0].toUpperCase().substring(0, 3);
            setValue('companyKey', newKey, { shouldValidate: true });
            setSuggestions(suggestionsList);
            setShowSuggestions(true);
          }
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to generate key';
          toast.error(errorMessage);
        },
      },
    );
  }, [companyName, getSuggestions, setValue]);

  // Select a suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    // Only use 2-3 uppercase letters, no year/hyphen
    const newKey = suggestion.toUpperCase().substring(0, 3);
    setValue('companyKey', newKey, { shouldValidate: true });
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.company-key-suggestions') &&
        !target.closest('#companyKey') &&
        !target.closest('button[type="button"]')?.closest('.relative')
      ) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // File drop handlers
  const onTaxFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        setValue('companyTaxFile', acceptedFiles[0], { shouldValidate: true });
      }
    },
    [setValue],
  );

  const onLicenseFileDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        setValue('companyTradeLicenseFile', acceptedFiles[0], {
          shouldValidate: true,
        });
      }
    },
    [setValue],
  );

  const {
    getRootProps: getTaxRootProps,
    getInputProps: getTaxInputProps,
    isDragActive: isTaxDragActive,
  } = useDropzone({
    onDrop: onTaxFileDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const {
    getRootProps: getLicenseRootProps,
    getInputProps: getLicenseInputProps,
    isDragActive: isLicenseDragActive,
  } = useDropzone({
    onDrop: onLicenseFileDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  // Validate current step fields
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: string[] = [];

    switch (step) {
      case 1:
        if (isEditMode) {
          // In edit mode, password fields are optional
          fieldsToValidate = ['operatorName', 'operatorEmail', 'phoneNumber'];
          // Only validate password if it's provided
          const passwordValue = getValues('password' as any);
          const confirmPasswordValue = getValues('confirmPassword' as any);
          if (passwordValue || confirmPasswordValue) {
            fieldsToValidate.push('password', 'confirmPassword');
          }
        } else {
          fieldsToValidate = [
            'operatorName',
            'operatorEmail',
            'phoneNumber',
            'password',
            'confirmPassword',
          ];
        }
        break;
      case 2:
        fieldsToValidate = ['companyName', 'companyKey', 'companyDescription'];
        break;
      case 3:
        fieldsToValidate = ['companyAddress'];
        break;
      case 4:
        if (isEditMode) {
          // In edit mode, files are optional
          fieldsToValidate = [
            'companyTaxNumber',
            'companyTradeLicenseIssueNumber',
            'companyTradeLicenseExpiryDate',
          ];
        } else {
          fieldsToValidate = [
            'companyTaxNumber',
            'companyTradeLicenseIssueNumber',
            'companyTradeLicenseExpiryDate',
            'companyTaxFile',
            'companyTradeLicenseFile',
          ];
        }
        break;
    }

    const result = await trigger(fieldsToValidate as any);
    return result;
  };

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      const maxStep = isEditMode ? 4 : 4; // Both modes have step 4 as the last step
      setCurrentStep((prev) => Math.min(prev + 1, maxStep));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleRegister = (data: RegisterFormValues) => {
    // CRITICAL: Only submit if we're on the last step (step 4)
    if (currentStep !== 4) {
      return;
    }

    if (isEditMode) {
      // Edit mode - use PATCH API with FormData
      if (!companyId) return;

      if (keyCheckData !== undefined && keyCheckData.available === false) {
        toast.error('Please choose an available company key');
        return;
      }

      // Create FormData for file uploads and JSON fields
      const formData = new FormData();

      // Add JSON fields
      formData.append('name', data.companyName);
      formData.append('description', data.companyDescription);
      // Format date as YYYY-MM-DD (ISO date format)
      const expiryDate = data.companyTradeLicenseExpiryDate
        .toISOString()
        .split('T')[0];
      formData.append('tradeLicenseExpiryDate', expiryDate);

      // Add companyKey if it exists and is valid (2-3 uppercase letters)
      if (
        data.companyKey &&
        data.companyKey.length >= 2 &&
        data.companyKey.length <= 3
      ) {
        formData.append('companyKey', data.companyKey.toUpperCase());
      }

      // Note: companyAddress is not allowed in update API
      // Address updates need to be done through a separate endpoint

      // Add files ONLY if they are new File objects (user uploaded new files)
      // Don't send files if they haven't changed - this prevents backend from trying to delete old files
      const taxFile = data.companyTaxFile;
      const licenseFile = data.companyTradeLicenseFile;

      // Only append if it's a File object (newly uploaded), not a string (existing URL)
      if (taxFile && taxFile instanceof File) {
        formData.append('taxFile', taxFile);
      }
      // If taxFile is not a File, don't send it - backend will keep existing file

      if (licenseFile && licenseFile instanceof File) {
        formData.append('tradeLicenseFile', licenseFile);
      }
      // If licenseFile is not a File, don't send it - backend will keep existing file
      // Note: idProofFile, passportProofFile, utilityBillFile are not in current form
      // Add them if needed in the future

      updateCompany.mutate(
        { companyId, payload: formData },
        {
          onSuccess: () => {
            toast.success('Company updated successfully');
            navigate('/companies/list');
          },
          onError: (error: any) => {
            let errorMessage = 'Failed to update company. Please try again.';
            if (error?.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error?.response?.data?.error) {
              errorMessage = error.response.data.error;
            } else if (error?.response?.data?.errors) {
              // Handle validation errors array
              const errors = error.response.data.errors;
              if (Array.isArray(errors) && errors.length > 0) {
                errorMessage = errors
                  .map((e: any) => {
                    return `${e.field}: ${e.constraints?.join(', ') || e.message || e}`;
                  })
                  .join('; ');
              }
            } else if (error?.message) {
              errorMessage = error.message;
            }
            toast.error(errorMessage);
          },
        },
      );
    } else {
      // Create mode - use POST API
      if (keyCheckData !== undefined && keyCheckData.available === false) {
        toast.error('Please choose an available company key');
        return;
      }

      const formData = new FormData();

      if (
        !data.companyAddress.country ||
        !data.companyAddress.state ||
        !data.companyAddress.city
      ) {
        toast.error('Please complete the company address');
        return;
      }

      if (!data.companyTaxFile || !data.companyTradeLicenseFile) {
        toast.error('Please upload both required documents');
        return;
      }

      const createData = data as CreateFormValues;
      formData.append('operatorName', createData.operatorName);
      formData.append('operatorEmail', createData.operatorEmail);
      formData.append('password', createData.password);
      formData.append('phoneNumber', createData.phoneNumber);
      formData.append('companyName', createData.companyName);
      formData.append('companyKey', createData.companyKey);
      formData.append('companyDescription', createData.companyDescription);
      formData.append('companyTaxNumber', createData.companyTaxNumber);
      formData.append(
        'companyTradeLicenseIssueNumber',
        createData.companyTradeLicenseIssueNumber,
      );
      formData.append(
        'companyTradeLicenseExpiryDate',
        createData.companyTradeLicenseExpiryDate.toISOString(),
      );

      const addressData = {
        addressLabel: createData.companyAddress.addressLabel || 'Head Office',
        street: createData.companyAddress.street,
        apartment: createData.companyAddress.apartment || '',
        city: createData.companyAddress.city,
        state: createData.companyAddress.state,
        country: createData.companyAddress.country,
        postalCode: createData.companyAddress.postalCode || '',
        additionalInfo: createData.companyAddress.additionalInfo || '',
      };
      formData.append('companyAddress', JSON.stringify(addressData));

      formData.append('companyTaxFile', createData.companyTaxFile);
      formData.append(
        'companyTradeLicenseFile',
        createData.companyTradeLicenseFile,
      );

      uploadFile(formData, {
        onSuccess: () => {
          setSuccessModalOpen(true);
        },
        onError: (error: any) => {
          let errorMessage = 'Registration failed. Please try again.';
          if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          toast.error(errorMessage);
        },
      });
    }
  };

  // Handle save draft
  const handleSaveDraft = () => {
    const data = getValues();
    localStorage.setItem(
      'companyFormDraft',
      JSON.stringify({
        ...data,
        companyTradeLicenseExpiryDate:
          data.companyTradeLicenseExpiryDate?.toISOString(),
        companyTaxFile: null,
        companyTradeLicenseFile: null,
      }),
    );
    toast.success('Draft saved successfully!');
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F56304] flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">
                  Operator Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter the operator's personal details and credentials
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="operatorName" className="text-sm font-normal">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="operatorName"
                  type="text"
                  placeholder="Enter full name"
                  {...register('operatorName' as any)}
                  className="pl-10 h-11 bg-muted border-input"
                />
              </div>
              {(errors as any).operatorName && (
                <p className="text-sm text-red-500">
                  {(errors as any).operatorName.message}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operatorEmail" className="text-sm font-normal">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="operatorEmail"
                    type="email"
                    placeholder="operator@company.com"
                    {...register('operatorEmail' as any)}
                    className="pl-10 h-11 bg-muted border-input"
                  />
                </div>
                {(errors as any).operatorEmail && (
                  <p className="text-sm text-red-500">
                    {(errors as any).operatorEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-normal">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
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
                      value={field.value || ''}
                      placeholder="50 123 4567"
                      className="flex h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
                    />
                  )}
                />
                {(errors as any).phoneNumber && (
                  <p className="text-sm text-red-500">
                    {(errors as any).phoneNumber.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-normal">
                  Password{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Optional)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      isEditMode
                        ? 'Leave empty to keep current password'
                        : 'Create strong password'
                    }
                    {...register('password' as any)}
                    className="pl-10 pr-10 h-11 bg-muted border-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must contain uppercase, number, special character, and be at
                  least 8 characters
                </p>
                {(errors as any).password && (
                  <p className="text-sm text-red-500">
                    {(errors as any).password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-normal"
                >
                  Confirm Password{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Optional)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={
                      isEditMode
                        ? 'Re-enter new password if changing'
                        : 'Re-enter password'
                    }
                    {...register('confirmPassword' as any)}
                    className="pl-10 pr-10 h-11 bg-muted border-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {(errors as any).confirmPassword && (
                  <p className="text-sm text-red-500">
                    {(errors as any).confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F56304] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">
                  Company Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your company details and business information
                </p>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-normal">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter company name"
                {...register('companyName')}
                className="h-11 bg-muted border-input"
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Company Key */}
            <div className="space-y-2 relative">
              <Label
                htmlFor="companyKey"
                className="text-sm font-normal flex items-center gap-2"
              >
                Company Key <span className="text-red-500">*</span>
                {!isEditMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[#155DFC] bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Auto-generated
                  </span>
                )}
                {isEditMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted rounded-full">
                    Read-only
                  </span>
                )}
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyKey"
                  type="text"
                  placeholder="ABC"
                  value={companyKey}
                  onChange={(e) => {
                    if (!isEditMode) {
                      // Filter: only uppercase A-Z, max 3 characters
                      const filtered = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .substring(0, 3);
                      setValue('companyKey', filtered, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  className={cn(
                    'pl-10 pr-10 h-11 uppercase',
                    isEditMode
                      ? 'bg-muted/50 text-muted-foreground border-muted cursor-not-allowed'
                      : 'bg-orange-50 dark:bg-orange-950/30 text-foreground border-orange-300 dark:border-orange-700',
                  )}
                />
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={generateCompanyKey}
                    disabled={isSuggesting || !companyName}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {isSuggesting ? (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? 'Company key cannot be changed after creation'
                  : 'This unique identifier will be used for system integration'}
              </p>
              {errors.companyKey && (
                <p className="text-sm text-red-500">
                  {errors.companyKey.message}
                </p>
              )}
              {!isEditMode && companyKey.length >= 2 && !errors.companyKey && (
                <div className="flex items-center gap-2">
                  {isCheckingKey ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icons.spinner className="h-3 w-3 animate-spin" />
                      Checking availability...
                    </span>
                  ) : keyCheckData?.available === false ? (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      This key is already taken
                    </span>
                  ) : keyCheckData?.available === true ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Available
                    </span>
                  ) : null}
                </div>
              )}
              {!isEditMode && showSuggestions && suggestions.length > 0 && (
                <div className="company-key-suggestions absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-2 px-2">
                      Suggestions:
                    </p>
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className="px-3 py-2 hover:bg-muted cursor-pointer rounded flex items-center justify-between"
                        onMouseDown={() => handleSelectSuggestion(suggestion)}
                      >
                        <span className="font-medium uppercase">
                          {suggestion}
                        </span>
                        <button className="text-xs text-orange-500 hover:underline">
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label
                htmlFor="companyDescription"
                className="text-sm font-normal"
              >
                Company Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="companyDescription"
                placeholder="Provide a brief description of your company's services and operations..."
                {...register('companyDescription')}
                className="min-h-[120px] bg-muted border-input"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 50 characters recommended
              </p>
              {errors.companyDescription && (
                <p className="text-sm text-red-500">
                  {errors.companyDescription.message}
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F56304] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">
                  Company Address
                </h2>
                <p className="text-sm text-muted-foreground">
                  Provide the company's physical location details
                </p>
              </div>
            </div>

            {/* Country & State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-normal">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="companyAddress.country"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <SelectTrigger className="h-11 bg-muted border-input">
                        <Globe className="w-5 h-5 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countryList.map((c) => (
                          <SelectItem key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.companyAddress?.country && (
                  <p className="text-sm text-red-500">
                    {errors.companyAddress.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">
                  State/Emirates <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="companyAddress.state"
                  control={control}
                  render={({ field }) => {
                    const states = State.getStatesOfCountry(selectedCountry);
                    return (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={!selectedCountry || !states.length}
                      >
                        <SelectTrigger className="h-11 bg-muted border-input">
                          <Building className="w-5 h-5 mr-2 text-muted-foreground" />
                          <SelectValue
                            placeholder={
                              !selectedCountry
                                ? 'Select country first'
                                : 'Select state'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s.isoCode} value={s.isoCode}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.companyAddress?.state && (
                  <p className="text-sm text-red-500">
                    {errors.companyAddress.state.message}
                  </p>
                )}
              </div>
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-normal">
                  City <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="companyAddress.city"
                  control={control}
                  render={({ field }) => {
                    const cities = City.getCitiesOfState(
                      selectedCountry,
                      selectedState,
                    );
                    if (cities.length === 0) {
                      return (
                        <Input
                          placeholder="Enter city name"
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="h-11 bg-muted border-input"
                        />
                      );
                    }
                    return (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={!selectedCountry || !selectedState}
                      >
                        <SelectTrigger className="h-11 bg-muted border-input">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((ct) => (
                            <SelectItem key={ct.name} value={ct.name}>
                              {ct.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                {errors.companyAddress?.city && (
                  <p className="text-sm text-red-500">
                    {errors.companyAddress.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-normal">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  placeholder="12345"
                  {...register('companyAddress.postalCode')}
                  className="h-11 bg-muted border-input"
                />
              </div>
            </div>

            {/* Street Address */}
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm font-normal">
                Street Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street"
                placeholder="Street name, building number"
                {...register('companyAddress.street')}
                className="h-11 bg-muted border-input"
              />
              {errors.companyAddress?.street && (
                <p className="text-sm text-red-500">
                  {errors.companyAddress.street.message}
                </p>
              )}
            </div>

            {/* Apartment/Office/Floor */}
            <div className="space-y-2">
              <Label htmlFor="apartment" className="text-sm font-normal">
                Apartment/Office/Floor
              </Label>
              <Input
                id="apartment"
                placeholder="Apartment, suite, unit, building, floor, etc."
                {...register('companyAddress.apartment')}
                className="h-11 bg-muted border-input"
              />
            </div>

            {/* Additional Directions */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-sm font-normal">
                Additional Directions
              </Label>
              <Input
                id="additionalInfo"
                placeholder="Any landmarks or additional information to help locate your office..."
                {...register('companyAddress.additionalInfo')}
                className="h-11 bg-muted border-input"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F56304] flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">
                  Documents & Verification
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upload required documents for company verification
                </p>
              </div>
            </div>

            {/* Tax Number & Trade License Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="companyTaxNumber"
                  className="text-sm font-normal flex items-center gap-1"
                >
                  Company Tax Number <span className="text-red-500">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your company's official tax registration number</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="companyTaxNumber"
                  placeholder="Enter tax registration number"
                  {...register('companyTaxNumber')}
                  className="h-11 bg-muted border-input"
                />
                {errors.companyTaxNumber && (
                  <p className="text-sm text-red-500">
                    {errors.companyTaxNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="companyTradeLicenseIssueNumber"
                  className="text-sm font-normal flex items-center gap-1"
                >
                  Trade License Number <span className="text-red-500">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your company's trade license registration number</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="companyTradeLicenseIssueNumber"
                  placeholder="Enter trade license number"
                  {...register('companyTradeLicenseIssueNumber')}
                  className="h-11 bg-muted border-input"
                />
                {errors.companyTradeLicenseIssueNumber && (
                  <p className="text-sm text-red-500">
                    {errors.companyTradeLicenseIssueNumber.message}
                  </p>
                )}
              </div>
            </div>

            {/* Trade License Expiry Date */}
            <div className="space-y-2 max-w-md">
              <Label className="text-sm font-normal">
                Trade License Expiry Date{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="companyTradeLicenseExpiryDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-11 justify-start text-left font-normal bg-muted border-input"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {field.value ? (
                          format(field.value, 'MM/dd/yyyy')
                        ) : (
                          <span className="text-muted-foreground">
                            Pick a date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        fromDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.companyTradeLicenseExpiryDate && (
                <p className="text-sm text-red-500">
                  {errors.companyTradeLicenseExpiryDate.message}
                </p>
              )}
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax Certificate Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-normal">
                  Tax Certificate{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                  <span className="text-xs text-muted-foreground ml-2">
                    (PDF, JPG, PNG - Max 5MB)
                  </span>
                  {isEditMode && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Optional - leave empty to keep existing)
                    </span>
                  )}
                </Label>
                <div
                  {...getTaxRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    isTaxDragActive
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
                      : watch('companyTaxFile')
                        ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                        : 'border-border bg-muted hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30',
                  )}
                >
                  <input {...getTaxInputProps()} />
                  {watch('companyTaxFile') ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="font-medium text-sm truncate max-w-full">
                        {(watch('companyTaxFile') as File)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Drop file here or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tax certificate document
                      </p>
                    </div>
                  )}
                </div>
                {errors.companyTaxFile && (
                  <p className="text-sm text-red-500">
                    {errors.companyTaxFile.message}
                  </p>
                )}
              </div>

              {/* Trade License Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-normal">
                  Trade License{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                  <span className="text-xs text-muted-foreground ml-2">
                    (PDF, JPG, PNG - Max 5MB)
                  </span>
                  {isEditMode && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Optional - leave empty to keep existing)
                    </span>
                  )}
                </Label>
                <div
                  {...getLicenseRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    isLicenseDragActive
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
                      : watch('companyTradeLicenseFile')
                        ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                        : 'border-border bg-muted hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30',
                  )}
                >
                  <input {...getLicenseInputProps()} />
                  {watch('companyTradeLicenseFile') ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="font-medium text-sm truncate max-w-full">
                        {(watch('companyTradeLicenseFile') as File)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Drop file here or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trade license document
                      </p>
                    </div>
                  )}
                </div>
                {errors.companyTradeLicenseFile && (
                  <p className="text-sm text-red-500">
                    {errors.companyTradeLicenseFile.message}
                  </p>
                )}
              </div>
            </div>

            {/* Document Verification Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-normal text-[#1A1A1A]">
                  Document Verification
                </p>
                <p className="text-sm text-[#6B7280]">
                  All uploaded documents will be reviewed within 24-48 hours.
                  You'll receive an email notification once verified.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {isEditMode ? 'Edit Company' : 'Add New Company'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditMode
            ? 'Update company information'
            : 'View and manage all registered companies'}
        </p>
      </div>

      {/* Back and Save Draft */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/companies/list')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Companies</span>
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          className="inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </Button>
      </div>

      {isLoadingCompany ? (
        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden mb-5 p-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className="text-muted-foreground">
              Loading company data...
            </span>
          </div>
        </Card>
      ) : (
        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden mb-5">
          {/* Stepper */}
          <div className="px-8 py-6 border-b border-border">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                              ? 'bg-orange-500 text-white'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs mt-2 font-medium',
                          isCurrent
                            ? 'text-orange-500'
                            : isCompleted
                              ? 'text-green-500'
                              : 'text-muted-foreground',
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-4',
                          currentStep > step.id ? 'bg-green-500' : 'bg-border',
                        )}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Main Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {/* Form Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // CRITICAL: Only submit if we're on step 4 AND the submit button was explicitly clicked
            // This prevents auto-submission when pressing Enter in form fields
            return false;
          }}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form unless on submit button
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              // Only allow Enter to submit if we're on step 4 and it's the submit button
              if (currentStep !== 4) {
                e.preventDefault();
              }
            }
          }}
        >
          <div className="p-8">{renderStepContent()}</div>

          {/* Navigation Footer */}
          <div className="px-8 py-4 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="min-w-[100px]"
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>

            {(isEditMode ? currentStep < 4 : currentStep < 4) ? (
              <Button
                type="button"
                onClick={handleNext}
                className="min-w-[100px] bg-orange-500 hover:bg-orange-600 text-white"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Explicitly call handleSubmit only when button is clicked
                  if (currentStep === 4) {
                    handleSubmit(handleRegister)(e as any);
                  }
                }}
                disabled={isPending || isLoadingCompany}
                className="min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Submitting...'}
                  </>
                ) : isEditMode ? (
                  'Update Company'
                ) : (
                  'Submit Registration'
                )}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">
              Registration Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-foreground">
              Company has been added successfully.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You can now view details or return to the company list.
            </p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessModalOpen(false);
                navigate('/companies/list');
              }}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSuccessModalOpen(false);
                navigate('/companies/list');
              }}
              className="min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
            >
              View Company Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyForm;
