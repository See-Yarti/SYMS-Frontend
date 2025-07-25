// src/pages/company/CompanyForm.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    User, Building2, FileText, Mail, MapPin, Phone,
    Info, Check, Lock, Search,
    ShieldCheck, FileDigit, FileSignature, Calendar as CalendarIcon,
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

interface LocationAutocompleteProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    onPlaceSelected: (place: any) => void;
    countryCode: string; // <--- NEW
    placeholder?: string;
    className?: string;
}


const LocationAutocomplete = React.forwardRef<HTMLInputElement, LocationAutocompleteProps>(
    ({ id, value, onChange, onPlaceSelected, placeholder, className, countryCode }, ref) => {
        const [suggestions, setSuggestions] = useState<any[]>([]);
        const [showSuggestions, setShowSuggestions] = useState(false);
        const autocompleteService = useRef<any>(null);

        useEffect(() => {
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                return;
            }

            autocompleteService.current = new window.google.maps.places.AutocompleteService();

            return () => {
                autocompleteService.current = null;
            };
        }, []);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            onChange(inputValue);

            if (inputValue.length > 2) {
                autocompleteService.current?.getPlacePredictions(
                    { input: inputValue, componentRestrictions: { country: countryCode } },
                    (predictions: any[], status: string) => {
                        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                            setSuggestions(predictions);
                            setShowSuggestions(true);
                        } else {
                            setSuggestions([]);
                            setShowSuggestions(false);
                        }
                    }
                );
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const handleSelectSuggestion = (place: any) => {
            const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

            placesService.getDetails({ placeId: place.place_id }, (result: any, status: string) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    onChange(result.name || result.formatted_address);
                    onPlaceSelected(result);
                    setShowSuggestions(false);
                }
            });
        };

        const handleMapSelection = () => {
            toast.info('Map selection would open here in a full implementation');
        };

        return (
            <div className="relative w-full">
                <div className="relative">
                    <Input
                        id={id}
                        type="text"
                        ref={ref}
                        value={value}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className={`pl-10 ${className}`}
                        autoComplete="off"
                        onFocus={() => value.length > 2 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={handleMapSelection}
                        title="Select from map"
                    >
                        <MapPin className="h-4 w-4" />
                    </Button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {suggestions.map((suggestion) => (
                            <li
                                key={suggestion.place_id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleSelectSuggestion(suggestion)}
                            >
                                <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                                <div className="text-sm text-muted-foreground">
                                    {suggestion.structured_formatting.secondary_text}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }
);
LocationAutocomplete.displayName = "LocationAutocomplete";

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: uploadFile, isPending } = useUploadFile<{
        message: any; success: boolean
    }>('/company/create');
    const [uploadProgress, setUploadProgress] = useState(0);
    const countryList: CountryType[] = Country.getAllCountries();
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
        watch,
        setValue,
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
            companyTradeLicenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
    });

    const selectedCountry = watch('companyAddress.country');
    const selectedState = watch('companyAddress.state');

    // ***** ADD THIS RIGHT HERE *****
    useEffect(() => {
        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (window.google && window.google.maps && window.google.maps.places) {
            setGoogleMapsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setGoogleMapsLoaded(true);
        };

        script.onerror = () => {
            console.error('Failed to load Google Maps script');
            toast.error('Failed to load Google Maps. Please refresh the page.');
        };

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const handleAddressSelect = (place: any) => {
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
        if (city) setValue('companyAddress.city', city);
        if (state) setValue('companyAddress.state', state);
        if (country) setValue('companyAddress.country', country);
        if (postalCode) setValue('companyAddress.postalCode', postalCode);
    };

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
                    if (response.success) {
                        toast.success('Company registered successfully!');
                        navigate('/operators');
                    } else {
                        if (response.message) {
                            toast.error(response.message, {
                                description: 'Please check your input and try again'
                            });
                        } else {
                            toast.error('Registration failed. Please try again.');
                        }
                    }
                }, 500);
            },
            onError: (error: any) => {
                clearInterval(interval);
                setUploadProgress(0);
                toast.error(error.message || 'Registration failed. Please try again.');
            }
        });
    };


    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {!googleMapsLoaded && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-lg font-medium">Loading Google Maps...</p>
                        <div className="mt-4 flex justify-center">
                            <Icons.spinner className="h-8 w-8 animate-spin" />
                        </div>
                    </div>
                </div>
            )}

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
                                    type="password"
                                    placeholder="Confirm your password"
                                    disabled={isPending}
                                    {...register('confirmPassword')}
                                    className="pl-10"
                                />
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
                                                    disabled={!states.length}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
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
                                            return (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!cities.length}
                                                >
                                                    <SelectTrigger>
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
                                        <p className="text-sm text-destructive">{errors.companyAddress.city.message}</p>
                                    )}
                                </div>

                                {/* Street with Google Maps Autocomplete */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyAddress.street" className="flex items-center gap-1">
                                        Street Address
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="companyAddress.street"
                                        control={control}
                                        render={({ field }) => (
                                            <LocationAutocomplete
                                                id="companyAddress.street"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onPlaceSelected={handleAddressSelect}
                                                placeholder="LDA Avenue I, Block C, plot#1088"
                                                countryCode={selectedCountry || 'ae'} // <--- Add this line
                                            />

                                        )}
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