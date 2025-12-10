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
    Info, Check, Lock, Eye, EyeOff, Globe, Building,
    Calendar as CalendarIcon, Hash, Sparkles, RefreshCw,
    ArrowLeft, Save, Upload, AlertCircle, CheckCircle2
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
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

// Form schema
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
        .max(10, { message: 'Company key must be at most 10 characters' }),
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

// Step configuration
const STEPS = [
    { id: 1, title: 'Operator Info', icon: User },
    { id: 2, title: 'Company Info', icon: Building2 },
    { id: 3, title: 'Address', icon: MapPin },
    { id: 4, title: 'Documents', icon: FileText },
];

const CompanyForm: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: uploadFile, isPending } = useUploadFile<{
        message: any; success: boolean
    }>('/company/create');
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const countryList: CountryType[] = Country.getAllCountries();
    const { mutate: getSuggestions, isPending: isSuggesting } = useSuggestCompanyKeys();

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
        companyKey.length >= 2 ? companyKey : ''
    );

    // Clear state and city when country changes
    useEffect(() => {
        if (selectedCountry) {
            const states = State.getStatesOfCountry(selectedCountry);
            const currentState = getValues('companyAddress.state');
            if (currentState && !states.find(s => s.isoCode === currentState)) {
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
                const currentState = states.find(s => s.isoCode === selectedState);
                if (currentState) {
                    setValue('companyAddress.city', currentState.name, { shouldValidate: true });
                }
            } else {
                const states = State.getStatesOfCountry(selectedCountry);
                const stateNames = states.map(s => s.name);
                const currentCity = getValues('companyAddress.city');
                if (currentCity && stateNames.includes(currentCity) && !cities.find(c => c.name === currentCity)) {
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

        getSuggestions({ name: companyName.trim() }, {
            onSuccess: (response) => {
                if (response.suggestions && response.suggestions.length > 0) {
                    // Auto-select first suggestion
                    const newKey = `${response.suggestions[0]}-${new Date().getFullYear()}`;
                    setValue('companyKey', newKey, { shouldValidate: true });
                    setSuggestions(response.suggestions);
                    setShowSuggestions(true);
                }
            },
            onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate key';
                toast.error(errorMessage);
            }
        });
    }, [companyName, getSuggestions, setValue]);

    // Select a suggestion
    const handleSelectSuggestion = (suggestion: string) => {
        const newKey = `${suggestion}-${new Date().getFullYear()}`;
        setValue('companyKey', newKey, { shouldValidate: true });
        setShowSuggestions(false);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
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
            maxSize: 5 * 1024 * 1024
        });

    const { getRootProps: getLicenseRootProps, getInputProps: getLicenseInputProps, isDragActive: isLicenseDragActive } =
        useDropzone({
            onDrop: onLicenseFileDrop,
            accept: {
                'application/pdf': ['.pdf'],
                'image/*': ['.png', '.jpg', '.jpeg']
            },
            maxFiles: 1,
            maxSize: 5 * 1024 * 1024
        });

    // Validate current step fields
    const validateStep = async (step: number): Promise<boolean> => {
        let fieldsToValidate: (keyof RegisterFormValues)[] = [];

        switch (step) {
            case 1:
                fieldsToValidate = ['operatorName', 'operatorEmail', 'phoneNumber', 'password', 'confirmPassword'];
                break;
            case 2:
                fieldsToValidate = ['companyName', 'companyKey', 'companyDescription'];
                break;
            case 3:
                fieldsToValidate = ['companyAddress'];
                break;
            case 4:
                fieldsToValidate = ['companyTaxNumber', 'companyTradeLicenseIssueNumber', 'companyTradeLicenseExpiryDate', 'companyTaxFile', 'companyTradeLicenseFile'];
                break;
        }

        const result = await trigger(fieldsToValidate);
        return result;
    };

    // Handle next step
    const handleNext = async () => {
        const isValid = await validateStep(currentStep);
        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    // Handle previous step
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Handle form submission
    const handleRegister = (data: RegisterFormValues) => {
        if (keyCheckData !== undefined && keyCheckData.available === false) {
            toast.error('Please choose an available company key');
            return;
        }

        const formData = new FormData();

        if (!data.companyAddress.country || !data.companyAddress.state || !data.companyAddress.city) {
            toast.error('Please complete the company address');
            return;
        }

        if (!data.companyTaxFile || !data.companyTradeLicenseFile) {
            toast.error('Please upload both required documents');
            return;
        }

        formData.append('operatorName', data.operatorName);
        formData.append('operatorEmail', data.operatorEmail);
        formData.append('password', data.password);
        formData.append('phoneNumber', data.phoneNumber);
        formData.append('companyName', data.companyName);
        formData.append('companyKey', data.companyKey);
        formData.append('companyDescription', data.companyDescription);
        formData.append('companyTaxNumber', data.companyTaxNumber);
        formData.append('companyTradeLicenseIssueNumber', data.companyTradeLicenseIssueNumber);
        formData.append('companyTradeLicenseExpiryDate', data.companyTradeLicenseExpiryDate.toISOString());

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

        formData.append('companyTaxFile', data.companyTaxFile);
        formData.append('companyTradeLicenseFile', data.companyTradeLicenseFile);

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
            }
        });
    };

    // Handle save draft
    const handleSaveDraft = () => {
        const data = getValues();
        localStorage.setItem('companyFormDraft', JSON.stringify({
            ...data,
            companyTradeLicenseExpiryDate: data.companyTradeLicenseExpiryDate?.toISOString(),
            companyTaxFile: null,
            companyTradeLicenseFile: null,
        }));
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
                                <h2 className="text-xl font-medium text-gray-900">Operator Information</h2>
                                <p className="text-sm text-gray-500">Enter the operator's personal details and credentials</p>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="operatorName" className="text-sm font-normal">
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="operatorName"
                                    type="text"
                                    placeholder="Enter full name"
                                    {...register('operatorName')}
                                    className="pl-10 h-11 bg-gray-50 border-gray-200"
                                />
                            </div>
                            {errors.operatorName && (
                                <p className="text-sm text-red-500">{errors.operatorName.message}</p>
                            )}
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="operatorEmail" className="text-sm font-normal">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="operatorEmail"
                                        type="email"
                                        placeholder="operator@company.com"
                                        {...register('operatorEmail')}
                                        className="pl-10 h-11 bg-gray-50 border-gray-200"
                                    />
                                </div>
                                {errors.operatorEmail && (
                                    <p className="text-sm text-red-500">{errors.operatorEmail.message}</p>
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
                                            value={field.value}
                                            placeholder="50 123 4567"
                                            className="flex h-11 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                                        />
                                    )}
                                />
                                {errors.phoneNumber && (
                                    <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Password & Confirm Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-normal">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create strong password"
                                        {...register('password')}
                                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Must contain uppercase, number, special character, and be at least 8 characters
                                </p>
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-normal">
                                    Confirm Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        {...register('confirmPassword')}
                                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
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
                                <h2 className="text-xl font-medium text-gray-900">Company Information</h2>
                                <p className="text-sm text-gray-500">Enter your company details and business information</p>
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
                                className="h-11 bg-gray-50 border-gray-200"
                            />
                            {errors.companyName && (
                                <p className="text-sm text-red-500">{errors.companyName.message}</p>
                            )}
                        </div>

                        {/* Company Key */}
                        <div className="space-y-2 relative">
                            <Label htmlFor="companyKey" className="text-sm font-normal flex items-center gap-2">
                                Company Key <span className="text-red-500">*</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[#155DFC] bg-[#EFF6FF] rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Auto-generated
                                </span>
                            </Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                                <Input
                                    id="companyKey"
                                    type="text"
                                    placeholder="ACME-2025"
                                    value={companyKey}
                                    onChange={(e) => setValue('companyKey', e.target.value.toUpperCase(), { shouldValidate: true })}
                                    className="pl-10 pr-10 h-11 bg-[#FFB58424] text-[#1A1A1A] border-orange-300 uppercase"
                                />
                                <button
                                    type="button"
                                    onClick={generateCompanyKey}
                                    disabled={isSuggesting || !companyName}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
                                >
                                    {isSuggesting ? (
                                        <Icons.spinner className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                This unique identifier will be used for system integration
                            </p>
                            {errors.companyKey && (
                                <p className="text-sm text-red-500">{errors.companyKey.message}</p>
                            )}
                            {companyKey.length >= 2 && !errors.companyKey && (
                                <div className="flex items-center gap-2">
                                    {isCheckingKey ? (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
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
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="company-key-suggestions absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                                    <div className="p-2">
                                        <p className="text-xs text-gray-500 mb-2 px-2">Suggestions:</p>
                                        {suggestions.map((suggestion) => (
                                            <div
                                                key={suggestion}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded flex items-center justify-between"
                                                onMouseDown={() => handleSelectSuggestion(suggestion)}
                                            >
                                                <span className="font-medium uppercase">{suggestion}-{new Date().getFullYear()}</span>
                                                <button className="text-xs text-orange-500 hover:underline">Use</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Company Description */}
                        <div className="space-y-2">
                            <Label htmlFor="companyDescription" className="text-sm font-normal">
                                Company Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="companyDescription"
                                placeholder="Provide a brief description of your company's services and operations..."
                                {...register('companyDescription')}
                                className="min-h-[120px] bg-gray-50 border-gray-200"
                            />
                            <p className="text-xs text-gray-500">Minimum 50 characters recommended</p>
                            {errors.companyDescription && (
                                <p className="text-sm text-red-500">{errors.companyDescription.message}</p>
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
                                <h2 className="text-xl font-medium text-gray-900">Company Address</h2>
                                <p className="text-sm text-gray-500">Provide the company's physical location details</p>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                                                <Globe className="w-5 h-5 mr-2 text-gray-400" />
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
                                    <p className="text-sm text-red-500">{errors.companyAddress.country.message}</p>
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
                                                value={field.value}
                                                disabled={!selectedCountry || !states.length}
                                            >
                                                <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                                                    <Building className="w-5 h-5 mr-2 text-gray-500" />
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
                                    <p className="text-sm text-red-500">{errors.companyAddress.state.message}</p>
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
                                        const cities = City.getCitiesOfState(selectedCountry, selectedState);
                                        if (cities.length === 0) {
                                            return (
                                                <Input
                                                    placeholder="Enter city name"
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    className="h-11 bg-gray-50 border-gray-200"
                                                />
                                            );
                                        }
                                        return (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!selectedCountry || !selectedState}
                                            >
                                                <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
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
                                    <p className="text-sm text-red-500">{errors.companyAddress.city.message}</p>
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
                                    className="h-11 bg-gray-50 border-gray-200"
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
                                className="h-11 bg-gray-50 border-gray-200"
                            />
                            {errors.companyAddress?.street && (
                                <p className="text-sm text-red-500">{errors.companyAddress.street.message}</p>
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
                                className="h-11 bg-gray-50 border-gray-200"
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
                                className="h-11 bg-gray-50 border-gray-200"
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
                                <h2 className="text-xl font-medium text-gray-900">Documents & Verification</h2>
                                <p className="text-sm text-gray-500">Upload required documents for company verification</p>
                            </div>
                        </div>

                        {/* Tax Number & Trade License Number */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyTaxNumber" className="text-sm font-normal flex items-center gap-1">
                                    Company Tax Number <span className="text-red-500">*</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-gray-400" />
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
                                    className="h-11 bg-gray-50 border-gray-200"
                                />
                                {errors.companyTaxNumber && (
                                    <p className="text-sm text-red-500">{errors.companyTaxNumber.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyTradeLicenseIssueNumber" className="text-sm font-normal flex items-center gap-1">
                                    Trade License Number <span className="text-red-500">*</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-gray-400" />
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
                                    className="h-11 bg-gray-50 border-gray-200"
                                />
                                {errors.companyTradeLicenseIssueNumber && (
                                    <p className="text-sm text-red-500">{errors.companyTradeLicenseIssueNumber.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Trade License Expiry Date */}
                        <div className="space-y-2 max-w-md">
                            <Label className="text-sm font-normal">
                                Trade License Expiry Date <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                control={control}
                                name="companyTradeLicenseExpiryDate"
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 justify-start text-left font-normal bg-gray-50 border-gray-200"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                                                {field.value ? format(field.value, 'MM/dd/yyyy') : <span className="text-gray-400">Pick a date</span>}
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
                                <p className="text-sm text-red-500">{errors.companyTradeLicenseExpiryDate.message}</p>
                            )}
                        </div>

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tax Certificate Upload */}
                            <div className="space-y-2">
                                <Label className="text-sm font-normal">
                                    Tax Certificate <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-400 ml-2">(PDF, JPG, PNG - Max 5MB)</span>
                                </Label>
                                <div
                                    {...getTaxRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                                        isTaxDragActive
                                            ? "border-orange-400 bg-orange-50"
                                            : watch('companyTaxFile')
                                                ? "border-green-400 bg-green-50"
                                                : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50"
                                    )}
                                >
                                    <input {...getTaxInputProps()} />
                                    {watch('companyTaxFile') ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                <Check className="w-6 h-6 text-green-500" />
                                            </div>
                                            <p className="font-medium text-sm truncate max-w-full">{watch('companyTaxFile').name}</p>
                                            <p className="text-xs text-gray-500">Click to replace</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Drop file here or click to upload
                                            </p>
                                            <p className="text-xs text-gray-500">Tax certificate document</p>
                                        </div>
                                    )}
                                </div>
                                {errors.companyTaxFile && (
                                    <p className="text-sm text-red-500">{errors.companyTaxFile.message}</p>
                                )}
                            </div>

                            {/* Trade License Upload */}
                            <div className="space-y-2">
                                <Label className="text-sm font-normal">
                                    Trade License <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-400 ml-2">(PDF, JPG, PNG - Max 5MB)</span>
                                </Label>
                                <div
                                    {...getLicenseRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                                        isLicenseDragActive
                                            ? "border-orange-400 bg-orange-50"
                                            : watch('companyTradeLicenseFile')
                                                ? "border-green-400 bg-green-50"
                                                : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50"
                                    )}
                                >
                                    <input {...getLicenseInputProps()} />
                                    {watch('companyTradeLicenseFile') ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                <Check className="w-6 h-6 text-green-500" />
                                            </div>
                                            <p className="font-medium text-sm truncate max-w-full">{watch('companyTradeLicenseFile').name}</p>
                                            <p className="text-xs text-gray-500">Click to replace</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Drop file here or click to upload
                                            </p>
                                            <p className="text-xs text-gray-500">Trade license document</p>
                                        </div>
                                    )}
                                </div>
                                {errors.companyTradeLicenseFile && (
                                    <p className="text-sm text-red-500">{errors.companyTradeLicenseFile.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Document Verification Notice */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-normal text-[#1A1A1A]">Document Verification</p>
                                <p className="text-sm text-[#6B7280]">
                                    All uploaded documents will be reviewed within 24-48 hours. You'll receive an email notification once verified.
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
                <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
                <p className="text-sm text-gray-500 mt-1">View and manage all registered companies</p>
            </div>

            {/* Back and Save Draft */}
            <div className="flex items-center justify-between mb-6">
                <button
                    type="button"
                    onClick={() => navigate('/companies/list')}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
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

            <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden mb-5">
                {/* Stepper */}
                <div className="px-8 py-6 border-b border-gray-100">
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
                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                isCompleted
                                                    ? "bg-green-500 text-white"
                                                    : isCurrent
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-gray-100 text-gray-400"
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
                                                "text-xs mt-2 font-medium",
                                                isCurrent ? "text-orange-500" : isCompleted ? "text-green-500" : "text-gray-400"
                                            )}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={cn(
                                                "flex-1 h-0.5 mx-4",
                                                currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                                            )}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Main Card */}
            <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                {/* Form Content */}
                <form onSubmit={handleSubmit(handleRegister)}>
                    <div className="p-8">
                        {renderStepContent()}
                    </div>

                    {/* Navigation Footer */}
                    <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className="min-w-[100px]"
                        >
                            Previous
                        </Button>

                        <span className="text-sm text-gray-500">
                            Step {currentStep} of {STEPS.length}
                        </span>

                        {currentStep < 4 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="min-w-[100px] bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                {isPending ? (
                                    <>
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
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
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <DialogTitle className="text-xl font-semibold text-center">Registration Complete!</DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-4">
                        <p className="text-gray-600">Company has been added successfully.</p>
                        <p className="text-sm text-gray-500 mt-1">
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
