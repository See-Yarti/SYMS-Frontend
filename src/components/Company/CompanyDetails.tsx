// src/components/Company/CompanyDetails.tsx

import { useState, useEffect, useRef } from 'react';
import { queryClient } from '@/hooks/useCompanyApi';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    useGetCompanySettings,
    useGetPlanConfigs,
    useEnsureDefaultPlans,
    useSetCommissionOverride,
    useStartCompanySubscription,
} from '@/hooks/usePlansApi';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, MapPin, Search, ChevronDown } from 'lucide-react';
import { useGetCompany, useUnverifyCompany, useVerifyCompany } from '@/hooks/useCompanyApi';
import { useGetLocations, useCreateLocation, useUpdateLocation, useToggleLocation } from '@/hooks/useLocationApi';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Country, State, City } from 'country-state-city';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import CompanyMap from '@/components/CompanyMap';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import React from 'react';

interface Location {
    id: string;
    title: string;
    city: string;
    state: string;
    country: string;
    addressLine: string;
    longitude: string;
    latitude: string;
    isAirportZone: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface LocationsData {
    activeLocations: Location[];
    inactiveLocations: Location[];
}

interface LocationAutocompleteProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    onPlaceSelected: (place: any) => void;
    countryCode: string;
    placeholder?: string;
    className?: string;
}

const LocationAutocomplete = React.forwardRef<HTMLInputElement, LocationAutocompleteProps>(
    ({ id, value, onChange, onPlaceSelected, placeholder, className, countryCode }, ref) => {
        const [suggestions, setSuggestions] = useState<any[]>([]);
        const [showSuggestions, setShowSuggestions] = useState(false);
        const autocompleteService = useRef<any>(null);

        useEffect(() => {
            if (!window.google || !window.google.maps || !window.google.maps.places) return;
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

        const handleMapSelection = () => toast.info('Map selection would open here in a full implementation');

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
                                <div className="text-sm text-muted-foreground">{suggestion.structured_formatting.secondary_text}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }
);
LocationAutocomplete.displayName = 'LocationAutocomplete';

const CompanyDetail = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const { data: companyData, isLoading, error, refetch } = useGetCompany(companyId || '');
    const { data: locationsData, refetch: refetchLocations } = useGetLocations(companyId || '');
    const verifyCompany = useVerifyCompany();
    const unverifyCompany = useUnverifyCompany();
    const createLocation = useCreateLocation();
    const updateLocation = useUpdateLocation();
    const toggleLocation = useToggleLocation();

    const [isUnverifyDialogOpen, setIsUnverifyDialogOpen] = useState(false);
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
    const [isEditLocationDialogOpen, setIsEditLocationDialogOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [unverifiedReason, setUnverifiedReason] = useState('');
    const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');
    const [, setGoogleMapsLoaded] = useState(false);
    const countryList = Country.getAllCountries();

    // Stable id before company fetch resolves
    const safeCompanyId = companyId || '';

    const { data: settingsRes, refetch: refetchSettings, isLoading: settingsLoading } = useGetCompanySettings(safeCompanyId);
    const { data: planConfigs, isLoading: planLoading } = useGetPlanConfigs();
    const ensureDefaults = useEnsureDefaultPlans();

    const setOverride = useSetCommissionOverride(safeCompanyId);
    const startSub = useStartCompanySubscription(safeCompanyId);

    const [selectedTier, setSelectedTier] = useState<'BASIC' | 'GOLD' | 'PREMIUM' | 'DIAMOND'>('BASIC');
    const [subscriptionDays, setSubscriptionDays] = useState<number>(30);
    const [subscriptionMode, setSubscriptionMode] = useState<'startNow' | 'startAfterCurrent'>('startNow');
    const [subscriptionNote, setSubscriptionNote] = useState<string>('');

    // Prefer settings API; fall back to company
    const baseRate =
        settingsRes?.data.baseCommissionRate ??
        (companyData?.data?.company as any)?.baseCommissionRate ??
        '—';

    const effectiveRate = settingsRes?.data.settings.effectiveCommissionRate ?? baseRate;

    const [overrideRate, setOverrideRate] = useState<string>('');
    const [overrideEndsAt, setOverrideEndsAt] = useState<string>('2099-01-01T00:00:00Z');

    useEffect(() => {
        ensureDefaults.mutate(undefined, {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan-configs'] }),
        });

        if (settingsRes?.data.settings.currentTier) setSelectedTier(settingsRes.data.settings.currentTier);
        if (settingsRes?.data.settings.overrideCommissionRate) setOverrideRate(settingsRes.data.settings.overrideCommissionRate);
        if (settingsRes?.data.settings.overrideEndsAt) setOverrideEndsAt(settingsRes.data.settings.overrideEndsAt);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settingsRes?.timestamp]);

    // Location form
    const [locationForm, setLocationForm] = useState({
        title: '',
        city: '',
        state: '',
        country: 'AE',
        addressLine: '',
        longitude: 25.2048,
        latitude: 55.2708,
        isAirportZone: false,
    });

    // Load Google Maps API
    useEffect(() => {
        const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        console.log("The Google Api Key : ", googleMapsApiKey);

        if (window.google && window.google.maps && window.google.maps.places) {
            setGoogleMapsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleMapsLoaded(true);
        script.onerror = () => toast.error('Failed to load Google Maps. Please refresh the page.');
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
        const title = place.name || '';

        place.address_components.forEach((comp: any) => {
            const componentTypes = comp.types;
            if (componentTypes.includes('street_number')) streetNumber = comp.long_name;
            if (componentTypes.includes('route')) route = comp.long_name;
            if (componentTypes.includes('locality') || componentTypes.includes('postal_town')) city = comp.long_name;
            if (componentTypes.includes('administrative_area_level_1')) {
                const countryStates = State.getStatesOfCountry(locationForm.country);
                const matchedState = countryStates.find((s) => s.name === comp.long_name || s.isoCode === comp.short_name);
                state = matchedState?.isoCode || comp.short_name || comp.long_name;
            }
            if (componentTypes.includes('country')) {
                const countryObj = Country.getAllCountries().find((c) => c.name === comp.long_name || c.isoCode === comp.short_name);
                if (countryObj) country = countryObj.isoCode;
            }
        });

        if (!city && place.formatted_address) {
            const addressParts = place.formatted_address.split(',');
            if (addressParts.length > 1) city = addressParts[addressParts.length - 2].trim();
        }

        setLocationForm((prev) => ({
            ...prev,
            title: title || prev.title,
            addressLine: `${streetNumber} ${route}`.trim(),
            city: city || prev.city,
            state: state || prev.state,
            country: country || prev.country,
            longitude: place.geometry.location.lng(),
            latitude: place.geometry.location.lat(),
        }));
    };

    const handleCountryChange = (value: string) => {
        const country = Country.getCountryByCode(value);
        setLocationForm({
            ...locationForm,
            country: value,
            state: '',
            city: '',
            title: locationForm.title || country?.name || '',
        });
    };

    const handleStateChange = (value: string) => {
        const stateObj = State.getStateByCodeAndCountry(value, locationForm.country);
        setLocationForm({
            ...locationForm,
            state: value,
            city: '',
            title: locationForm.title || stateObj?.name || '',
        });
    };

    const handleCityChange = (value: string) => {
        setLocationForm({
            ...locationForm,
            city: value,
            title: locationForm.title || value || '',
        });
    };

    const handleVerify = () => {
        if (!companyId) return;
        verifyCompany.mutate(companyId, {
            onSuccess: () => {
                toast.success('Company verified successfully');
                refetch();
            },
            onError: (err) => toast.error('Failed to verify company', { description: err.message }),
        });
    };

    const handleUnverifySubmit = () => {
        if (!companyId) return;
        unverifyCompany.mutate(
            {
                companyId,
                payload: { unverifiedReason, unverifiedReasonDescription },
            },
            {
                onSuccess: () => {
                    toast.success('Company unverified successfully');
                    setIsUnverifyDialogOpen(false);
                    setUnverifiedReason('');
                    setUnverifiedReasonDescription('');
                    refetch();
                },
                onError: (err) => toast.error('Failed to unverify company', { description: err.message }),
            }
        );
    };

    const handleCreateLocation = () => {
        if (!companyId) return;
        const countryName = Country.getCountryByCode(locationForm.country)?.name || locationForm.country;
        createLocation.mutate(
            { companyId, payload: { ...locationForm, country: countryName } },
            {
                onSuccess: () => {
                    toast.success('Location created successfully');
                    setIsLocationDialogOpen(false);
                    setLocationForm({
                        title: '',
                        city: '',
                        state: '',
                        country: 'AE',
                        addressLine: '',
                        longitude: 25.2048,
                        latitude: 55.2708,
                        isAirportZone: false,
                    });
                    refetchLocations();
                },
                onError: (err) => toast.error('Failed to create location', { description: err.message }),
            }
        );
    };

    const handleUpdateLocation = () => {
        if (!currentLocation?.id) return;
        const countryName = Country.getCountryByCode(locationForm.country)?.name || locationForm.country;

        updateLocation.mutate(
            { id: currentLocation.id, payload: { ...locationForm, country: countryName } },
            {
                onSuccess: () => {
                    toast.success('Location updated successfully');
                    setIsEditLocationDialogOpen(false);
                    setCurrentLocation(null);
                    setLocationForm({
                        title: '',
                        city: '',
                        state: '',
                        country: 'AE',
                        addressLine: '',
                        longitude: 25.2048,
                        latitude: 55.2708,
                        isAirportZone: false,
                    });
                    refetchLocations();
                },
                onError: (err) => toast.error('Failed to update location', { description: err.message }),
            }
        );
    };

    const handleToggleLocation = (id: string) => {
        toggleLocation.mutate(id, {
            onSuccess: () => {
                toast.success('Location status updated');
                refetchLocations();
            },
            onError: (err) => toast.error('Failed to update location status', { description: err.message }),
        });
    };

    const openEditLocationDialog = (location: Location) => {
        setCurrentLocation(location);
        const countryCode = Country.getAllCountries().find((c) => c.name === location.country)?.isoCode || 'AE';
        setLocationForm({
            title: location.title,
            city: location.city,
            state: location.state,
            country: countryCode,
            addressLine: location.addressLine,
            longitude: parseFloat(location.longitude),
            latitude: parseFloat(location.latitude),
            isAirportZone: location.isAirportZone,
        });
        setIsEditLocationDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive p-4 text-destructive">
                <p>Error loading company details:</p>
                <p className="font-medium">{(error as any).message}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!companyData) {
        return (
            <div className="rounded-lg border p-4 text-center">
                <p>Company not found</p>
            </div>
        );
    }

    const company = companyData.data.company;
    const locations: LocationsData = locationsData?.data || { activeLocations: [], inactiveLocations: [] };
    const selectedCountry = locationForm.country;
    const selectedState = locationForm.state;
    const stateList = State.getStatesOfCountry(selectedCountry);
    const cityList = City.getCitiesOfState(selectedCountry, selectedState);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{company.name}</h1>
                    <p className="text-muted-foreground">{company.description}</p>
                </div>
                <Badge variant={company.isVerified ? 'default' : 'secondary'} className="ml-2">
                    {company.isVerified ? 'Verified' : 'Not Verified'}
                </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Company Details</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Tax Number</p>
                            <p>{company.taxNumber || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Trade License</p>
                            <p>{company.tradeLicenseIssueNumber || '-'}</p>
                            {company.tradeLicenseExpiryDate && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Expires: {format(new Date(company.tradeLicenseExpiryDate), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                        {company.citiesOfOperation?.length > 0 && (
                            <div>
                                <p className="text-sm text-muted-foreground">Cities of Operation</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {company.citiesOfOperation.map((city: string) => (
                                        <span key={city} className="bg-muted px-2 py-1 rounded text-sm">
                                            {city}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p>{format(new Date(company.createdAt), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Documents</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Tax File</p>
                            {company.taxFile ? (
                                <a href={company.taxFile} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                                    View Tax File
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            ) : (
                                <p className="text-muted-foreground">Not provided</p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Trade License</p>
                            {company.tradeLicenseFile ? (
                                <a href={company.tradeLicenseFile} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                                    View Trade License
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            ) : (
                                <p className="text-muted-foreground">Not provided</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Locations */}
            <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Locations</h2>
                    <Button size="sm" onClick={() => setIsLocationDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Location
                    </Button>
                </div>

                {/* Active */}
                {locations.activeLocations.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-medium mb-2">Active Locations</h3>
                        <div className="space-y-3">
                            {locations.activeLocations.map((location) => (
                                <div key={location.id} className="border rounded p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{location.title}</h4>
                                                {location.isAirportZone && <Badge variant="default">Airport Zone</Badge>}
                                            </div>
                                            <p className="text-sm mt-1">
                                                {location.addressLine}, {location.city}, {location.state}, {location.country}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditLocationDialog(location)}>
                                                Edit
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleToggleLocation(location.id)}>
                                                Disable
                                            </Button>
                                        </div>
                                    </div>

                                    <Accordion type="single" collapsible className="w-full mt-2">
                                        <AccordionItem value="map" className="border-0">
                                            <AccordionTrigger className="py-2 hover:no-underline">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <ChevronDown className="h-4 w-4 mr-1" />
                                                    Show Map
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="h-[200px] w-full rounded-lg overflow-hidden mt-2">
                                                    <CompanyMap
                                                        locations={[
                                                            {
                                                                lat: parseFloat(location.latitude),
                                                                lng: parseFloat(location.longitude),
                                                                address: location.addressLine,
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inactive */}
                {locations.inactiveLocations.length > 0 && (
                    <div>
                        <h3 className="font-medium mb-2">Inactive Locations</h3>
                        <div className="space-y-3">
                            {locations.inactiveLocations.map((location) => (
                                <div key={location.id} className="border rounded p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{location.title}</h4>
                                                {location.isAirportZone && <Badge variant="default">Airport Zone</Badge>}
                                            </div>
                                            <p className="text-sm mt-1">
                                                {location.addressLine}, {location.city}, {location.state}, {location.country}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Coordinates: {parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditLocationDialog(location)}>
                                                Edit
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleToggleLocation(location.id)}>
                                                Enable
                                            </Button>
                                        </div>
                                    </div>

                                    <Accordion type="single" collapsible className="w-full mt-2">
                                        <AccordionItem value="map" className="border-0">
                                            <AccordionTrigger className="py-2 hover:no-underline">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <ChevronDown className="h-4 w-4 mr-1" />
                                                    Show Map
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="h-[200px] w-full rounded-lg overflow-hidden mt-2">
                                                    <CompanyMap
                                                        locations={[
                                                            {
                                                                lat: parseFloat(location.latitude),
                                                                lng: parseFloat(location.longitude),
                                                                address: location.addressLine,
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Operators */}
            {company.operators && company.operators.length > 0 && (
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Operators</h2>
                    <div className="space-y-3">
                        {company.operators.map((operator: any) => (
                            <div key={operator.id} className="flex items-center gap-3 p-3 border rounded">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                    {operator.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{operator.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{operator.user.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {operator.operatorRole.replace('Operator', '').trim() || 'Operator'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">Last active: {format(new Date(operator.user.lastActivityAt), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Addresses */}
            {company.addresses && company.addresses.length > 0 && (
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Addresses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.addresses.map((address: any) => (
                            <div key={address.id} className="border rounded p-4">
                                <h3 className="font-medium">{address.addressLabel}</h3>
                                <p className="text-sm mt-1">
                                    {address.street}, {address.apartment}
                                </p>
                                <p className="text-sm">
                                    {address.city}, {address.state}, {address.country}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">{address.additionalInfo}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Plans & Commission — SIMPLE + CLEAR */}
            <div className="border rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">Plans & Commission</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="uppercase" variant="outline">
                            Tier: {settingsRes?.data.settings.currentTier ?? '—'}
                        </Badge>
                        <Badge variant="outline">Source: {settingsRes?.data.settings.commissionSource ?? '—'}</Badge>
                        <Badge>Effective: {effectiveRate}%</Badge>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-4">
                    <span>
                        Base rate: <span className="font-medium">{baseRate}%</span>
                    </span>
                    <span>
                        Subscription ends:{' '}
                        <span className="font-medium">
                            {settingsRes?.data.settings.subscriptionEndsAt
                                ? format(new Date(settingsRes.data.settings.subscriptionEndsAt), 'MMM d, yyyy HH:mm')
                                : '—'}
                        </span>
                    </span>
                </p>

                <Separator className="my-4" />

                <div className="grid gap-6 md:grid-cols-2">
                    {/* LEFT: Tier + Duration + Mode */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm">Choose Tier</Label>
                            <div className="flex flex-wrap gap-2">
                                {(planConfigs?.data ?? []).map((p: any) => {
                                    const isActive = selectedTier === p.tier;
                                    return (
                                        <Button
                                            key={p.tier}
                                            type="button"
                                            variant={isActive ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setSelectedTier(p.tier)}
                                            className="rounded-full"
                                        >
                                            {p.tier}
                                            {p.commissionDelta !== '0.00' ? ` · +${p.commissionDelta}%` : ''}
                                        </Button>
                                    );
                                })}
                                {!planLoading && !planConfigs?.data?.length && (
                                    <span className="text-xs text-muted-foreground">No tiers found</span>
                                )}
                            </div>
                            <ProjectedRateHelper baseRate={baseRate} selectedTier={selectedTier} planConfigs={planConfigs} />
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                            <div className="grow min-w-[160px]">
                                <Label className="text-sm">Days</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setSubscriptionDays((d) => Math.max(1, d - 1))}
                                    >
                                        —
                                    </Button>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={subscriptionDays}
                                        onChange={(e) => setSubscriptionDays(Math.max(1, Number(e.target.value || 1)))}
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setSubscriptionDays((d) => d + 1)}>
                                        +
                                    </Button>
                                </div>
                            </div>

                            <div className="grow min-w-[220px]">
                                <Label className="text-sm">Mode</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={subscriptionMode === 'startNow' ? 'default' : 'outline'}
                                        onClick={() => setSubscriptionMode('startNow')}
                                        className="flex-1"
                                    >
                                        Start now
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={subscriptionMode === 'startAfterCurrent' ? 'default' : 'outline'}
                                        onClick={() => setSubscriptionMode('startAfterCurrent')}
                                        className="flex-1"
                                    >
                                        Queue
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm">Note (optional)</Label>
                            <Input
                                value={subscriptionNote}
                                onChange={(e) => setSubscriptionNote(e.target.value)}
                                placeholder="e.g., upgrade now"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                className="min-w-[160px]"
                                disabled={startSub.isPending || planLoading || settingsLoading || !selectedTier}
                                onClick={() => {
                                    startSub.mutate(
                                        { tier: selectedTier, days: subscriptionDays, mode: subscriptionMode, note: subscriptionNote || undefined },
                                        {
                                            onSuccess: (r) => {
                                                toast.success(r.data.message, {
                                                    description: `Active ${format(new Date(r.data.data.startsAt), 'MMM d, yyyy HH:mm')} → ${format(
                                                        new Date(r.data.data.endsAt),
                                                        'MMM d, yyyy HH:mm'
                                                    )}`,
                                                });
                                                refetchSettings();
                                            },
                                            onError: (err) => toast.error('Failed to start subscription', { description: err.message }),
                                        }
                                    );
                                }}
                            >
                                {startSub.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {subscriptionMode === 'startNow' ? 'Start subscription' : 'Queue subscription'}
                            </Button>
                            {planLoading && <span className="text-xs text-muted-foreground">Loading plans…</span>}
                        </div>
                    </div>

                    {/* RIGHT: Override */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">Commission Override</h3>
                            <span className="text-xs text-muted-foreground">Overrides beat tier/base until expiry.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-sm">Override Rate (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={overrideRate}
                                    onChange={(e) => setOverrideRate(e.target.value)}
                                    placeholder="e.g., 8.50"
                                />
                            </div>
                            <div>
                                <Label className="text-sm">Override Ends (local)</Label>
                                <Input
                                    type="datetime-local"
                                    value={toLocalInputValue(overrideEndsAt)}
                                    onChange={(e) => setOverrideEndsAt(fromLocalInputValueToISO(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="secondary"
                                disabled={setOverride.isPending || !overrideRate || !overrideEndsAt}
                                onClick={() => {
                                    const rateNum = Number(overrideRate);
                                    if (Number.isNaN(rateNum) || rateNum <= 0) {
                                        toast.error('Enter a valid override rate > 0');
                                        return;
                                    }
                                    setOverride.mutate(
                                        { rate: rateNum, endsAt: overrideEndsAt },
                                        {
                                            onSuccess: () => {
                                                toast.success('Override applied');
                                                refetchSettings();
                                            },
                                            onError: (err) => toast.error('Failed to set override', { description: err.message }),
                                        }
                                    );
                                }}
                            >
                                {setOverride.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Override
                            </Button>

                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    const in30 = new Date();
                                    in30.setDate(in30.getDate() + 30);
                                    setOverrideEndsAt(in30.toISOString());
                                }}
                            >
                                +30 days
                            </Button>

                            {settingsRes?.data.settings.overrideCommissionRate && (
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        const current = Number(settingsRes.data.settings.overrideCommissionRate);
                                        setOverride.mutate(
                                            { rate: current, endsAt: new Date().toISOString() },
                                            {
                                                onSuccess: () => {
                                                    toast.success('Override expired');
                                                    refetchSettings();
                                                },
                                                onError: (err) => toast.error('Failed to expire override', { description: err.message }),
                                            }
                                        );
                                    }}
                                >
                                    Expire now
                                </Button>
                            )}

                            <span className="text-xs text-muted-foreground">
                                Current:{' '}
                                <strong>
                                    {settingsRes?.data.settings.overrideCommissionRate
                                        ? `${settingsRes.data.settings.overrideCommissionRate}% until ${settingsRes.data.settings.overrideEndsAt
                                            ? format(new Date(settingsRes.data.settings.overrideEndsAt), 'MMM d, yyyy HH:mm')
                                            : '—'
                                        }`
                                        : 'none'}
                                </strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification */}
            <div className="flex gap-2">
                {company.isVerified ? (
                    <>
                        <Button variant="outline" onClick={() => setIsUnverifyDialogOpen(true)} disabled={unverifyCompany.isPending}>
                            Unverify Company
                        </Button>

                        <Dialog open={isUnverifyDialogOpen} onOpenChange={setIsUnverifyDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Unverify Company</DialogTitle>
                                    <DialogDescription>Please provide a reason for unverifying this company.</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="unverifiedReason">Reason *</Label>
                                        <Input
                                            id="unverifiedReason"
                                            value={unverifiedReason}
                                            onChange={(e) => setUnverifiedReason(e.target.value)}
                                            placeholder="e.g., Document Expired, Missing Information"
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Short description of why you're unverifying this company</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="unverifiedReasonDescription">Details *</Label>
                                        <Textarea
                                            id="unverifiedReasonDescription"
                                            value={unverifiedReasonDescription}
                                            onChange={(e) => setUnverifiedReasonDescription(e.target.value)}
                                            placeholder="Provide detailed explanation..."
                                            className="mt-1"
                                            rows={4}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">This will be visible to the company</p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsUnverifyDialogOpen(false);
                                            setUnverifiedReason('');
                                            setUnverifiedReasonDescription('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUnverifySubmit} disabled={unverifyCompany.isPending || !unverifiedReason || !unverifiedReasonDescription}>
                                        {unverifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm Unverification
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                ) : (
                    <Button onClick={handleVerify} disabled={verifyCompany.isPending}>
                        {verifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify Company
                    </Button>
                )}
            </div>

            {/* Add Location Dialog */}
            <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sticky top-0 bg-background">
                        <DialogTitle>Add New Location</DialogTitle>
                        <DialogDescription>Note: Select the country first, then type the address—fields will auto-fill.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={locationForm.title}
                                onChange={(e) => setLocationForm({ ...locationForm, title: e.target.value })}
                                placeholder={
                                    locationForm.city || locationForm.state || locationForm.country
                                        ? `e.g., ${locationForm.city || locationForm.state || Country.getCountryByCode(locationForm.country)?.name}`
                                        : 'e.g., Main Office, Warehouse'
                                }
                            />
                        </div>

                        <div>
                            <Label>Address *</Label>
                            <LocationAutocomplete
                                id="addressLine"
                                value={locationForm.addressLine}
                                onChange={(value) => setLocationForm({ ...locationForm, addressLine: value })}
                                onPlaceSelected={handleAddressSelect}
                                placeholder="Enter full address"
                                countryCode={locationForm.country}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Country *</Label>
                                <Select
                                    value={locationForm.country}
                                    onValueChange={(value) => {
                                        const countryObj = Country.getCountryByCode(value);
                                        setLocationForm((prev) => ({
                                            ...prev,
                                            country: value,
                                            state: '',
                                            city: '',
                                            title: prev.title || countryObj?.name || '',
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {countryList.map((c) => (
                                            <SelectItem key={c.isoCode} value={c.isoCode}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>State *</Label>
                                <Select
                                    value={locationForm.state}
                                    onValueChange={(value) => {
                                        const stateObj = State.getStateByCodeAndCountry(value, locationForm.country);
                                        setLocationForm((prev) => ({
                                            ...prev,
                                            state: value,
                                            city: '',
                                            title: prev.title || stateObj?.name || '',
                                        }));
                                    }}
                                    disabled={!stateList.length}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={stateList.length ? 'Select state' : 'No states available'} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {stateList.map((s) => (
                                            <SelectItem key={s.isoCode} value={s.isoCode}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>City *</Label>
                                <Select
                                    value={locationForm.city}
                                    onValueChange={(value) => {
                                        setLocationForm((prev) => ({
                                            ...prev,
                                            city: value,
                                            title: prev.title || value || '',
                                        }));
                                    }}
                                    disabled={!cityList.length}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={cityList.length ? 'Select city' : 'No cities available'} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {cityList.map((ct) => (
                                            <SelectItem key={ct.name} value={ct.name}>
                                                {ct.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="longitude">Longitude *</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    value={locationForm.longitude}
                                    onChange={(e) => setLocationForm({ ...locationForm, longitude: parseFloat(e.target.value) })}
                                    placeholder="e.g., 55.2708"
                                />
                            </div>
                            <div>
                                <Label htmlFor="latitude">Latitude *</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    value={locationForm.latitude}
                                    onChange={(e) => setLocationForm({ ...locationForm, latitude: parseFloat(e.target.value) })}
                                    placeholder="e.g., 25.2048"
                                />
                            </div>
                        </div>

                        <div className="h-[200px] w-full rounded-lg overflow-hidden">
                            <CompanyMap
                                locations={[
                                    {
                                        lat: locationForm.latitude,
                                        lng: locationForm.longitude,
                                        address: locationForm.addressLine,
                                    },
                                ]}
                            />
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <Switch
                                id="airport-zone"
                                checked={locationForm.isAirportZone}
                                onCheckedChange={(checked) => setLocationForm({ ...locationForm, isAirportZone: checked })}
                            />
                            <Label htmlFor="airport-zone">Airport Zone</Label>
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateLocation} disabled={createLocation.isPending || !locationForm.title || !locationForm.addressLine}>
                            {createLocation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Location
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Location Dialog */}
            <Dialog open={isEditLocationDialogOpen} onOpenChange={setIsEditLocationDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sticky top-0 bg-background">
                        <DialogTitle>Edit Location</DialogTitle>
                        <DialogDescription>Update the details for this location</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                                id="edit-title"
                                value={locationForm.title}
                                onChange={(e) => setLocationForm({ ...locationForm, title: e.target.value })}
                                placeholder={
                                    locationForm.city || locationForm.state || locationForm.country
                                        ? `e.g., ${locationForm.city || locationForm.state || Country.getCountryByCode(locationForm.country)?.name}`
                                        : 'e.g., Main Office, Warehouse'
                                }
                            />
                        </div>

                        <div>
                            <Label>Address *</Label>
                            <LocationAutocomplete
                                id="edit-addressLine"
                                value={locationForm.addressLine}
                                onChange={(value) => setLocationForm({ ...locationForm, addressLine: value })}
                                onPlaceSelected={handleAddressSelect}
                                placeholder="Enter full address"
                                countryCode={locationForm.country}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Country *</Label>
                                <Select value={locationForm.country} onValueChange={handleCountryChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {countryList.map((c) => (
                                            <SelectItem key={c.isoCode} value={c.isoCode}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>State *</Label>
                                <Select value={locationForm.state} onValueChange={handleStateChange} disabled={!stateList.length}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {stateList.map((s) => (
                                            <SelectItem key={s.isoCode} value={s.isoCode}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>City *</Label>
                                <Select value={locationForm.city} onValueChange={handleCityChange} disabled={!cityList.length}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {cityList.map((ct) => (
                                            <SelectItem key={ct.name} value={ct.name}>
                                                {ct.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-longitude">Longitude *</Label>
                                <Input
                                    id="edit-longitude"
                                    type="number"
                                    value={locationForm.longitude}
                                    onChange={(e) => setLocationForm({ ...locationForm, longitude: parseFloat(e.target.value) })}
                                    placeholder="e.g., 55.2708"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-latitude">Latitude *</Label>
                                <Input
                                    id="edit-latitude"
                                    type="number"
                                    value={locationForm.latitude}
                                    onChange={(e) => setLocationForm({ ...locationForm, latitude: parseFloat(e.target.value) })}
                                    placeholder="e.g., 25.2048"
                                />
                            </div>
                        </div>

                        <div className="h-[200px] w-full rounded-lg overflow-hidden">
                            <CompanyMap
                                locations={[
                                    {
                                        lat: locationForm.latitude,
                                        lng: locationForm.longitude,
                                        address: locationForm.addressLine,
                                    },
                                ]}
                            />
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <Switch
                                id="edit-airport-zone"
                                checked={locationForm.isAirportZone}
                                onCheckedChange={(checked) => setLocationForm({ ...locationForm, isAirportZone: checked })}
                            />
                            <Label htmlFor="edit-airport-zone">Airport Zone</Label>
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsEditLocationDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateLocation} disabled={updateLocation.isPending || !locationForm.title || !locationForm.addressLine}>
                            {updateLocation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Location
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CompanyDetail;

/* ---------- Helpers ---------- */

function ProjectedRateHelper({
    baseRate,
    selectedTier,
    planConfigs,
}: {
    baseRate: string | number;
    selectedTier: 'BASIC' | 'GOLD' | 'PREMIUM' | 'DIAMOND';
    planConfigs: any;
}) {
    const base = Number(baseRate);
    const delta = planConfigs
        ? Number((planConfigs.data.find((p: any) => p.tier === selectedTier)?.commissionDelta) ?? '0')
        : 0;
    const projected = Number.isFinite(base) ? (base + delta).toFixed(2) : '—';

    return (
        <div className="text-xs text-muted-foreground">
            Projected effective with <span className="font-medium">{selectedTier}</span>:{' '}
            <span className="font-medium">{projected}%</span>
        </div>
    );
}

// Convert ISO -> <input type="datetime-local">
function toLocalInputValue(iso: string) {
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    } catch {
        return '';
    }
}

// Convert local input -> UTC ISO
function fromLocalInputValueToISO(localValue: string) {
    try {
        const d = new Date(localValue);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    } catch {
        return new Date().toISOString();
    }
}