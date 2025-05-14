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
    Info, ArrowRight, Check, Plus, Trash2, Lock, Search,
    ShieldCheck, FileDigit, FileSignature, Calendar as CalendarIcon
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import "react-phone-number-input/style.css";
import { motion, AnimatePresence } from 'framer-motion';
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

// Enhanced validation schema with custom error messages
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
    phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
    companyName: z.string()
        .min(1, { message: 'Company name is required' })
        .max(100, { message: 'Company name must be less than 100 characters' }),
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
    companyCitiesOfOperation: z.array(z.string().min(1, { message: 'City is required' }))
        .min(1, { message: 'At least one city is required' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type CountryType = ReturnType<typeof Country.getAllCountries>[number];
type StateType = ReturnType<typeof State.getStatesOfCountry>[number];
type CityType = ReturnType<typeof City.getCitiesOfState>[number];

interface RegisterFormProps {
    currentStep: number;
    setCurrentStep: (step: number) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ currentStep, setCurrentStep }) => {
    const navigate = useNavigate();
    const { mutate: uploadFile, isPending } = useUploadFile<{
        message: any; success: boolean
    }>('/company/create');
    const [, setCities] = useState<string[]>(['']);
    const [uploadProgress, setUploadProgress] = useState(0);
    const countryList: CountryType[] = Country.getAllCountries();

    const [stateList, setStateList] = useState<StateType[]>([]);
    const [cityList, setCityList] = useState<CityType[]>([]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
        trigger,
        watch,
        setValue,
        getValues
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            companyAddress: {
                country: 'AE',
                state: 'DU',
                city: 'Dubai',
                addressLabel: 'Head Office'
            },
            companyCitiesOfOperation: [''],
            companyTradeLicenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
    });

    const selectedCountry = watch('companyAddress.country');
    const selectedState = watch('companyAddress.state');

    // Initialize Google Maps Autocomplete
    useEffect(() => {
        if (currentStep !== 2) return;

        const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!googleMapsApiKey) {
            console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY is missing. Check your .env and restart Vite.');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
        script.async = true;
        script.onload = () => {
            const input = document.getElementById('companyAddress.street') as HTMLInputElement;
            if (!input || !(window as any).google) return;

            const autocomplete = new (window as any).google.maps.places.Autocomplete(input, {
                types: ['geocode'],
                fields: ['address_components', 'geometry', 'formatted_address'],
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.address_components) return;

                let streetNumber = '';
                let route = '';
                let city = '';
                let state = '';
                let country = '';
                let postalCode = '';

                place.address_components.forEach((comp: any) => {
                    if (comp.types.includes('street_number')) streetNumber = comp.long_name;
                    if (comp.types.includes('route')) route = comp.long_name;
                    if (comp.types.includes('locality')) city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                    if (comp.types.includes('country')) country = comp.short_name;
                    if (comp.types.includes('postal_code')) postalCode = comp.long_name;
                });

                setValue('companyAddress.street', `${streetNumber} ${route}`.trim());
                setValue('companyAddress.city', city);
                setValue('companyAddress.state', state);
                setValue('companyAddress.country', country);
                setValue('companyAddress.postalCode', postalCode);
            });
        };

        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [currentStep, setValue]);

    // when country changes, load states
    useEffect(() => {
        if (!selectedCountry) return;
        const states = State.getStatesOfCountry(selectedCountry);
        setStateList(states);
        setValue('companyAddress.state', states[0]?.isoCode || '');
        setCityList([]);
        setValue('companyAddress.city', '');
    }, [selectedCountry, setValue]);

    // when state changes, load cities
    useEffect(() => {
        if (!selectedCountry || !selectedState) return;
        const cities = City.getCitiesOfState(selectedCountry, selectedState);
        setCityList(cities);
        setValue('companyAddress.city', cities[0]?.name || '');
    }, [selectedCountry, selectedState, setValue]);

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

    // Update the handleRegister function to properly handle backend errors
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

        // Simulate upload progress (replace with actual progress events if your API supports them)
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
                    if (response.success) {
                        toast.success('Company registered successfully!');
                        navigate('/operators');
                    } else {
                        // Handle backend validation errors
                        if (response.message) {
                            toast.error(response.message, {
                                description: 'Please check your input and try again'
                            });

                            // Focus on the relevant field if possible
                            if (response.message.includes('tax number')) {
                                const taxNumberInput = document.getElementById('companyTaxNumber');
                                taxNumberInput?.focus();
                            }
                        } else {
                            toast.error('Registration failed. Please try again.');
                        }
                    }
                }, 500);
            },
            onError: (error: any) => {
                clearInterval(interval);
                setUploadProgress(0);

                // Handle different types of errors
                if (error.response?.data) {
                    const { message } = error.response.data;
                    if (message) {
                        toast.error(message, {
                            description: 'Please check your input and try again'
                        });

                        // Focus on relevant fields based on error message
                        if (message.includes('tax number')) {
                            const taxNumberInput = document.getElementById('companyTaxNumber');
                            taxNumberInput?.focus();
                        } else if (message.includes('email')) {
                            const emailInput = document.getElementById('operatorEmail');
                            emailInput?.focus();
                        }
                    } else {
                        toast.error('Registration failed. Please try again.');
                    }
                } else {
                    toast.error(error.message || 'Registration failed. Please try again.');
                }
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
        const currentCities = getValues('companyCitiesOfOperation');
        const updatedCities = [...currentCities, ''];
        setCities(updatedCities);
        setValue('companyCitiesOfOperation', updatedCities, { shouldValidate: true });
    };

    const removeCity = (index: number) => {
        const currentCities = getValues('companyCitiesOfOperation');
        const updatedCities = [...currentCities];
        updatedCities.splice(index, 1);
        setCities(updatedCities);
        setValue('companyCitiesOfOperation', updatedCities, { shouldValidate: true });
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10"></div>

                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex flex-col items-center z-10">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 
                ${currentStep >= step ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-500'}`}
                        >
                            {step}
                        </div>
                        <span className={`mt-2 text-sm font-medium ${currentStep >= step ? 'text-primary' : 'text-gray-500'}`}>
                            {step === 1 && 'Operator Info'}
                            {step === 2 && 'Company Details'}
                            {step === 3 && 'Documents'}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(handleRegister)} className="space-y-8">
                <AnimatePresence mode="wait">
                    {/* Step 1: Operator Information */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
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
                                                placeholder="admin "
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
                                                type="password"
                                                placeholder="admin1122@"
                                                disabled={isPending}
                                                {...register('password')}
                                                className="pl-10"
                                            />
                                        </div>
                                        {errors.password ? (
                                            <p className="text-sm text-destructive">{errors.password.message}</p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Must contain uppercase, number, special character, and be at least 8 characters
                                            </p>
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
                        </motion.div>
                    )}

                    {/* Step 2: Company Information */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
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
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!stateList.length}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select state" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {stateList.map((s) => (
                                                                    <SelectItem key={s.isoCode} value={s.isoCode}>
                                                                        {s.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
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
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!cityList.length}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select city" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {cityList.map((ct) => (
                                                                    <SelectItem key={ct.name} value={ct.name}>
                                                                        {ct.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {errors.companyAddress?.city && (
                                                    <p className="text-sm text-destructive">{errors.companyAddress.city.message}</p>
                                                )}
                                            </div>

                                            {/* Street with Google Maps Autocomplete */}
                                            <div className="space-y-2">
                                                <Label htmlFor="companyAddress.street" className="flex items-center gap-1">
                                                    Street Address
                                                    <span className="text-destructive">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="companyAddress.street"
                                                        placeholder="LDA Avenue I, Block C, plot#1088"
                                                        disabled={isPending}
                                                        {...register('companyAddress.street')}
                                                        className="pl-10"
                                                    />
                                                </div>
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

                                    {/* Cities of Operation */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium flex items-center gap-2 text-lg">
                                                <MapPin className="h-5 w-5 text-primary" />
                                                Cities of Operation
                                                <span className="text-destructive">*</span>
                                            </h4>
                                        </div>

                                        <div className="space-y-3">
                                            {getValues('companyCitiesOfOperation')?.map((_city, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <Controller
                                                        name={`companyCitiesOfOperation.${index}`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value}
                                                                disabled={!cityList.length}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select city" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {cityList.map((ct) => (
                                                                        <SelectItem key={ct.name} value={ct.name}>
                                                                            {ct.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {index === getValues('companyCitiesOfOperation')?.length - 1 ? (
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
                                            {errors.companyCitiesOfOperation && (
                                                <p className="text-sm text-destructive">{errors.companyCitiesOfOperation.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Step 3: Documents & Verification */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4">
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
                            className="min-w-[120px] ml-auto"
                        >
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={isPending || !isValid}
                            className="min-w-[200px] ml-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
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