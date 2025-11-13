// src/pages/company/CompanyForm.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    User, Building2, FileText, Mail, MapPin, Phone,
    Info, Check, Lock, Eye, EyeOff,
    ShieldCheck, FileDigit, FileSignature, Calendar as CalendarIcon,
    Key, Sparkles,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import "react-phone-number-input/style.css";
import { Country, State, City } from 'country-state-city';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUploadFile } from '@/hooks/useApi';
import { useCheckCompanyKey, useSuggestCompanyKeys } from '@/hooks/useCompanyApi';
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useDropzone } from 'react-dropzone';
import { Progress } from '@/components/ui/progress';

// Updated schema without location name and shortcut
const registerSchema = z.object({
    operatorName: z.string()
        .min(1, { message: 'Full name is required' })
        .max(100, { message: 'Name must be less than 100 characters' }),
    operatorEmail: z.string()
        .email({ message: 'Please enter a valid email address' })
        .max(100, { message: 'Email must be less than 100 characters' }),
    password: z.string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
        .regex(/[0-9]/, { message: 'Must contain at least one number' })
        .regex(/[^a-zA-Z0-9]/, { message: 'Must contain at least one special character' }),
    confirmPassword: z.string()
        .min(1, { message: 'Confirm Password is required' }),
    phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
    companyName: z.string()
        .min(1, { message: 'Company name is required' })
        .max(100, { message: 'Company name must be less than 100 characters' }),
    companyKey: z.string()
        .min(2, { message: 'Company key must be at least 2 characters' })
        .max(3, { message: 'Company key must be at most 3 characters' })
        .regex(/^[A-Z]+$/, { message: 'Company key must contain only uppercase letters' }),
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
    companyDescription: z.string()
        .min(10, { message: 'Description must be at least 10 characters' })
        .max(500, { message: 'Description must be less than 500 characters' }),
    companyTaxFile: z.instanceof(File, { message: 'Tax file is required' })
        .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
    companyTaxNumber: z.string().min(1, { message: 'Tax number is required' }),
    companyTradeLicenseFile: z.instanceof(File, { message: 'Trade license is required' })
        .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB'),
    companyTradeLicenseIssueNumber: z.string().min(1, { message: 'License issue number is required' }),
    companyTradeLicenseExpiryDate: z.date({ required_error: 'Expiry date is required' }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type CountryType = ReturnType<typeof Country.getAllCountries>[number];

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: uploadFile, isPending } = useUploadFile<{
        message: any; success: boolean
    }>('/company/create');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const countryList: CountryType[] = Country.getAllCountries();
    const { mutate: getSuggestions, isPending: isSuggesting } = useSuggestCompanyKeys();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
        watch,
        setValue,
        getValues,
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            companyAddress: {
                addressLabel: 'Head Office'
            },
            companyTradeLicenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
    });

    const selectedCountry = watch('companyAddress.country');
    const selectedState = watch('companyAddress.state');
    const companyKey = watch('companyKey') || '';
    const companyName = watch('companyName') || '';
    
    // Check company key availability
    const { data: keyCheckData, isLoading: isCheckingKey } = useCheckCompanyKey(
        companyKey.length >= 2 && companyKey.length <= 3 ? companyKey : ''
    );

    // Clear state and city when country changes
    useEffect(() => {
        if (selectedCountry) {
            const states = State.getStatesOfCountry(selectedCountry);
            const currentState = getValues('companyAddress.state');
            // If current state is not in the new country's states, clear it
            if (currentState && !states.find(s => s.isoCode === currentState)) {
                setValue('companyAddress.state', '', { shouldValidate: false });
                setValue('companyAddress.city', '', { shouldValidate: false });
            }
        } else {
            // If no country selected, clear state and city
            setValue('companyAddress.state', '', { shouldValidate: false });
            setValue('companyAddress.city', '', { shouldValidate: false });
        }
    }, [selectedCountry, setValue, getValues]);

    // Auto-set city to state name when no cities are available, or clear when state changes
    useEffect(() => {
        if (selectedCountry && selectedState) {
            const cities = City.getCitiesOfState(selectedCountry, selectedState);
            if (cities.length === 0) {
                // No cities available, use state name as city
                const states = State.getStatesOfCountry(selectedCountry);
                const currentState = states.find(s => s.isoCode === selectedState);
                if (currentState) {
                    setValue('companyAddress.city', currentState.name, { shouldValidate: true });
                }
            } else {
                // Cities are available - clear city if it was set to a state name
                const states = State.getStatesOfCountry(selectedCountry);
                const stateNames = states.map(s => s.name);
                const currentCity = getValues('companyAddress.city');
                if (currentCity && stateNames.includes(currentCity) && !cities.find(c => c.name === currentCity)) {
                    // Current city is a state name, not a valid city - clear it
                    setValue('companyAddress.city', '', { shouldValidate: false });
                }
            }
        } else if (selectedCountry && !selectedState) {
            // If state is cleared, clear city too
            setValue('companyAddress.city', '', { shouldValidate: false });
        }
    }, [selectedCountry, selectedState, setValue, getValues]);


    // Handle company key input with auto-capitalization
    const handleCompanyKeyChange = (value: string) => {
        // Remove non-alphabetic characters and convert to uppercase
        const cleaned = value.replace(/[^A-Za-z]/g, '').toUpperCase();
        // Limit to 3 characters
        const limited = cleaned.slice(0, 3);
        setValue('companyKey', limited, { shouldValidate: true });
    };

    // Get suggestions for company key
    const handleGetSuggestions = () => {
        if (showSuggestions && suggestions.length > 0) {
            // Toggle off if already showing
            setShowSuggestions(false);
            return;
        }
        
        // Check if company name is provided
        if (!companyName || companyName.trim().length === 0) {
            toast.error('Please enter a company name first');
            return;
        }
        
        getSuggestions({ name: companyName.trim() }, {
            onSuccess: (response) => {
                setSuggestions(response.suggestions || []);
                setShowSuggestions(true);
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get suggestions';
                toast.error(errorMessage);
            }
        });
    };

    // Select a suggestion
    const handleSelectSuggestion = (suggestion: string) => {
        setValue('companyKey', suggestion, { shouldValidate: true });
        setShowSuggestions(false);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Don't close if clicking on suggestions dropdown, input field, or suggestions button
            if (!target.closest('.company-key-suggestions') && 
                !target.closest('#companyKey') &&
                !target.closest('button[type="button"]')?.closest('.relative')) {
                setShowSuggestions(false);
            }
        };
        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSuggestions]);

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
        // Check if company key is available before submitting (only if key is valid and API was called)
        const isValidKey = companyKey.length >= 2 && companyKey.length <= 3 && /^[A-Z]+$/.test(companyKey);
        
        if (isValidKey) {
            // Only check if API call was made (keyCheckData exists)
            if (keyCheckData !== undefined) {
                if (isCheckingKey) {
                    toast.error('Please wait while we check the availability of your company key');
                    return;
                }
                if (keyCheckData.available === false) {
                    toast.error('Please choose an available company key');
                    return;
                }
                // If available is true, allow submission
            }
            // If keyCheckData is undefined (API not called yet), allow form to submit
            // Backend will validate the key
        }

        const formData = new FormData();

        // Validate required fields before sending
        if (!data.companyAddress.country || !data.companyAddress.state || !data.companyAddress.city) {
            toast.error('Please complete the company address (Country, State, and City are required)');
            return;
        }

        if (!data.companyTaxFile || !data.companyTradeLicenseFile) {
            toast.error('Please upload both tax file and trade license file');
            return;
        }

        // Basic fields
        formData.append('operatorName', data.operatorName);
        formData.append('operatorEmail', data.operatorEmail);
        formData.append('password', data.password);
        formData.append('phoneNumber', data.phoneNumber);
        formData.append('companyName', data.companyName);
        formData.append('companyKey', data.companyKey);
        formData.append('companyDescription', data.companyDescription);
        formData.append('companyTaxNumber', data.companyTaxNumber);
        formData.append('companyTradeLicenseIssueNumber', data.companyTradeLicenseIssueNumber);

        // Date format
        formData.append(
            'companyTradeLicenseExpiryDate',
            data.companyTradeLicenseExpiryDate.toISOString()
        );

        // Address (as JSON string) - ensure all required fields are present
        const addressData = {
            addressLabel: data.companyAddress.addressLabel || 'Head Office',
            street: data.companyAddress.street,
            apartment: data.companyAddress.apartment || '',
            city: data.companyAddress.city,
            state: data.companyAddress.state,
            country: data.companyAddress.country,
            postalCode: data.companyAddress.postalCode || '',
            additionalInfo: data.companyAddress.additionalInfo || '',
        };
        formData.append('companyAddress', JSON.stringify(addressData));

        // File uploads
        formData.append('companyTaxFile', data.companyTaxFile);
        formData.append('companyTradeLicenseFile', data.companyTradeLicenseFile);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 10;
            });
        }, 300);

        uploadFile(formData, {
            onSuccess: (response) => {
                clearInterval(interval);
                setUploadProgress(100);
                setTimeout(() => {
                    // Since we're in onSuccess callback, API call was successful (201 Created)
                    // Show success toast with the message from API or default message
                    const successMessage = response.message || 'Company registered successfully!';
                    toast.success(successMessage);
                    navigate('/companies/list');
                }, 500);
            },
            onError: (error: any) => {
                clearInterval(interval);
                setUploadProgress(0);
                
                // Extract error message from backend response
                let errorMessage = 'Registration failed. Please try again.';
                
                // Check error.response.data.message (most common for backend errors)
                if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                // Check error.response.data.error
                else if (error?.response?.data?.error) {
                    errorMessage = error.response.data.error;
                }
                // Check error.response.data.errors (validation errors array)
                else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
                    errorMessage = error.response.data.errors.map((err: any) => err.message || err).join(', ');
                }
                // Check error.message (the Error object's message)
                else if (error?.message) {
                    errorMessage = error.message;
                }
                
                toast.error(errorMessage);
            }
        });
    };


    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-8">
                {/* Operator Information Section */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <User className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle className="text-xl">Operator Information</CardTitle>
                                <CardDescription>
                                    Enter the operator's personal details
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Operator Name */}
                        <div className="space-y-2">
                            <Label htmlFor="operatorName" className="flex items-center gap-1">
                                Full Name
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="operatorName"
                                    type="text"
                                    placeholder="admin"
                                    disabled={isPending}
                                    {...register('operatorName')}
                                    className="pl-10"
                                    autoFocus
                                />
                            </div>
                            {errors.operatorName && (
                                <p className="text-sm text-destructive">{errors.operatorName.message}</p>
                            )}
                        </div>

                        {/* Operator Email */}
                        <div className="space-y-2">
                            <Label htmlFor="operatorEmail" className="flex items-center gap-1">
                                Email
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="operatorEmail"
                                    type="email"
                                    placeholder="admin1122@gmail.com"
                                    disabled={isPending}
                                    {...register('operatorEmail')}
                                    className="pl-10"
                                />
                            </div>
                            {errors.operatorEmail && (
                                <p className="text-sm text-destructive">{errors.operatorEmail.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-1">
                                Password
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="admin1122@"
                                    disabled={isPending}
                                    {...register('password')}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password ? (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Must contain uppercase, number, special character, and be at least 8 characters
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                                Confirm Password
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    disabled={isPending}
                                    {...register('confirmPassword')}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                                Phone Number
                                <span className="text-destructive">*</span>
                            </Label>
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
                            {errors.phoneNumber && (
                                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Company Information Section */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle className="text-xl">Company Information</CardTitle>
                                <CardDescription>
                                    Enter your company details
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company Name */}
                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="flex items-center gap-1">
                                    Company Name
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="companyName"
                                    type="text"
                                    placeholder="Artema Tech"
                                    disabled={isPending}
                                    {...register('companyName')}
                                />
                                {errors.companyName && (
                                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                                )}
                            </div>

                            {/* Company Key */}
                            <div className="space-y-2 relative">
                                <Label htmlFor="companyKey" className="flex items-center gap-1">
                                    <Key className="h-4 w-4" />
                                    Company Key
                                    <span className="text-destructive">*</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>2-3 uppercase letters (e.g., ABC, XY)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                                <div className="relative">
                                    <Controller
                                        name="companyKey"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <Input
                                                    id="companyKey"
                                                    type="text"
                                                    placeholder="ABC"
                                                    disabled={isPending}
                                                    value={field.value || ''}
                                                    onChange={(e) => handleCompanyKeyChange(e.target.value)}
                                                    onBlur={field.onBlur}
                                                    className="pl-10 pr-20 uppercase"
                                                    maxLength={3}
                                                    autoComplete="off"
                                                />
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                                                    onClick={handleGetSuggestions}
                                                    disabled={isPending || isSuggesting || !companyName || companyName.trim().length === 0}
                                                    title={!companyName || companyName.trim().length === 0 ? 'Enter company name first' : 'Get suggestions'}
                                                >
                                                    {isSuggesting ? (
                                                        <Icons.spinner className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    />
                                </div>
                                {errors.companyKey && (
                                    <p className="text-sm text-destructive">{errors.companyKey.message}</p>
                                )}
                                {companyKey.length >= 2 && companyKey.length <= 3 && !errors.companyKey && (
                                    <div className="flex items-center gap-2">
                                        {isCheckingKey ? (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Icons.spinner className="h-3 w-3 animate-spin" />
                                                Checking availability...
                                            </span>
                                        ) : keyCheckData?.available === false ? (
                                            <span className="text-xs text-destructive flex items-center gap-1">
                                                <Info className="h-3 w-3" />
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
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="company-key-suggestions absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-auto">
                                        <div className="p-2">
                                            <p className="text-xs text-muted-foreground mb-2 px-2">Suggestions:</p>
                                            {suggestions.map((suggestion) => (
                                                <div
                                                    key={suggestion}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded flex items-center justify-between"
                                                    onMouseDown={() => handleSelectSuggestion(suggestion)}
                                                >
                                                    <span className="font-medium uppercase">{suggestion}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectSuggestion(suggestion)}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Use
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Company Description */}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="companyDescription" className="flex items-center gap-1">
                                    Company Description
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="companyDescription"
                                    placeholder="Brief description of your company..."
                                    disabled={isPending}
                                    {...register('companyDescription')}
                                    className="min-h-[100px]"
                                />
                                {errors.companyDescription && (
                                    <p className="text-sm text-destructive">{errors.companyDescription.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Company Address */}
                        <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2 text-lg">
                                <MapPin className="h-5 w-5 text-primary" />
                                Company Address
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Country */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        Country
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="companyAddress.country"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60 overflow-y-auto">
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
                                        <p className="text-sm text-destructive">{errors.companyAddress.country.message}</p>
                                    )}
                                </div>

                                {/* State */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        State/Emirate
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="companyAddress.state"
                                        control={control}
                                        render={({ field }) => {
                                            const states = State.getStatesOfCountry(selectedCountry);
                                            return (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!selectedCountry || !states.length}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={!selectedCountry ? "Select country first" : "Select state"} />
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
                                        <p className="text-sm text-destructive">{errors.companyAddress.state.message}</p>
                                    )}
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        City
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="companyAddress.city"
                                        control={control}
                                        render={({ field }) => {
                                            const cities = City.getCitiesOfState(selectedCountry, selectedState);
                                            // If no cities available, show read-only input with state name
                                            if (cities.length === 0) {
                                                const states = State.getStatesOfCountry(selectedCountry);
                                                const currentState = states.find(s => s.isoCode === selectedState);
                                                return (
                                                    <Input
                                                        value={currentState?.name || field.value || ''}
                                                        disabled={!selectedCountry || !selectedState}
                                                        readOnly
                                                        className="bg-muted"
                                                    />
                                                );
                                            }
                                            // If cities are available, show select dropdown
                                            return (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!selectedCountry || !selectedState}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={!selectedState ? "Select state first" : "Select city"} />
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
                                        <p className="text-sm text-destructive">{errors.companyAddress.city.message}</p>
                                    )}
                                </div>

                                {/* Street Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyAddress.street" className="flex items-center gap-1">
                                        Street Address
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="companyAddress.street"
                                        type="text"
                                        placeholder="LDA Avenue I, Block C, plot#1088"
                                        disabled={isPending}
                                        {...register('companyAddress.street')}
                                    />
                                    {errors.companyAddress?.street && (
                                        <p className="text-sm text-destructive">{errors.companyAddress.street.message}</p>
                                    )}
                                </div>

                                {/* Apartment/Office */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyAddress.apartment">Apartment/Office</Label>
                                    <Input
                                        id="companyAddress.apartment"
                                        placeholder="Artema Tech"
                                        disabled={isPending}
                                        {...register('companyAddress.apartment')}
                                    />
                                </div>

                                {/* Postal Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyAddress.postalCode">Postal Code</Label>
                                    <Input
                                        id="companyAddress.postalCode"
                                        placeholder="54000"
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
                    </CardContent>
                </Card>

                {/* Documents & Verification Section */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-primary" />
                            <div>
                                <CardTitle className="text-xl">Documents & Verification</CardTitle>
                                <CardDescription>
                                    Upload required documents for verification
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tax Information */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyTaxNumber" className="flex items-center gap-1">
                                    <FileDigit className="h-4 w-4" />
                                    Company Tax Number
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="companyTaxNumber"
                                    placeholder="2312333"
                                    disabled={isPending}
                                    {...register('companyTaxNumber')}
                                />
                                {errors.companyTaxNumber && (
                                    <p className="text-sm text-destructive">{errors.companyTaxNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    Tax Certificate File
                                    <span className="text-destructive">*</span>
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
                                </Label>
                                <div
                                    {...getTaxRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isTaxDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'
                                        }`}
                                >
                                    <input {...getTaxInputProps()} />
                                    {watch('companyTaxFile') ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-10 w-10 text-primary" />
                                            <p className="font-medium truncate max-w-full">{watch('companyTaxFile').name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Click to replace or drag and drop
                                            </p>
                                            <span className="text-xs text-green-600">File selected</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-10 w-10 text-primary" />
                                            <p className="font-medium">
                                                {isTaxDragActive ? 'Drop the file here' : 'Drag & drop tax file here'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                or click to select file (PDF, JPG, PNG)
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {errors.companyTaxFile && (
                                    <p className="text-sm text-destructive">{errors.companyTaxFile.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Trade License Information */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyTradeLicenseIssueNumber" className="flex items-center gap-1">
                                    <FileSignature className="h-4 w-4" />
                                    Trade License Issue Number
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="companyTradeLicenseIssueNumber"
                                    placeholder="213213222"
                                    disabled={isPending}
                                    {...register('companyTradeLicenseIssueNumber')}
                                />
                                {errors.companyTradeLicenseIssueNumber && (
                                    <p className="text-sm text-destructive">{errors.companyTradeLicenseIssueNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyTradeLicenseExpiryDate" className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    Trade License Expiry Date
                                    <span className="text-destructive">*</span>
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
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                                {errors.companyTradeLicenseExpiryDate && (
                                    <p className="text-sm text-destructive">{errors.companyTradeLicenseExpiryDate.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Trade License File */}
                        <div className="space-y-3 md:col-span-2">
                            <Label className="flex items-center gap-1">
                                <ShieldCheck className="h-4 w-4" />
                                Trade License File
                                <span className="text-destructive">*</span>
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
                            </Label>
                            <div
                                {...getLicenseRootProps()}
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isLicenseDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'
                                    }`}
                            >
                                <input {...getLicenseInputProps()} />
                                {watch('companyTradeLicenseFile') ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-10 w-10 text-primary" />
                                        <p className="font-medium truncate max-w-full">{watch('companyTradeLicenseFile').name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Click to replace or drag and drop
                                        </p>
                                        <span className="text-xs text-green-600">File selected</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-10 w-10 text-primary" />
                                        <p className="font-medium">
                                            {isLicenseDragActive ? 'Drop the file here' : 'Drag & drop license file here'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            or click to select file (PDF, JPG, PNG)
                                        </p>
                                    </div>
                                )}
                            </div>
                            {errors.companyTradeLicenseFile && (
                                <p className="text-sm text-destructive">{errors.companyTradeLicenseFile.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
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
                </div>

                {isPending && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Uploading files...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </div>
                )}
            </form>
        </div>
    );
};

export default RegisterForm;