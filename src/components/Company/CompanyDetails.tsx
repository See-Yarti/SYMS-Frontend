import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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

    // Location form state
    const [locationForm, setLocationForm] = useState({
        title: '',
        city: '',
        state: '',
        country: 'AE',
        addressLine: '',
        longitude: 25.2048,
        latitude: 55.2708,
        isAirportZone: false
    });

    // Load Google Maps API
    useEffect(() => {
        const googleMapsApiKey = 'AIzaSyArcZmUlh5K8iNrlcPKlu53mis0MPe5hfI';

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
            //   console.error('Failed to load Google Maps script');
            toast.error('Failed to load Google Maps. Please refresh the page.');
        };

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    useEffect(() => {
        console.log('Current location form:', locationForm);
    }, [locationForm]);

    const handleAddressSelect = (place: any) => {
        console.log('Google Places response:', place);
        if (!place.geometry || !place.address_components) return;

        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let country = '';
        const title = place.name || '';

        // Extract address components
        place.address_components.forEach((comp: any) => {
            const componentTypes = comp.types;

            if (componentTypes.includes('street_number')) {
                streetNumber = comp.long_name;
            }
            if (componentTypes.includes('route')) {
                route = comp.long_name;
            }
            if (componentTypes.includes('locality') || componentTypes.includes('postal_town')) {
                city = comp.long_name;
            }
            if (componentTypes.includes('administrative_area_level_1')) {
                // Try to find matching state in our database
                const countryStates = State.getStatesOfCountry(locationForm.country);
                const matchedState = countryStates.find(s =>
                    s.name === comp.long_name || s.isoCode === comp.short_name
                );
                state = matchedState?.isoCode || comp.short_name || comp.long_name;
            }
            if (componentTypes.includes('country')) {
                const countryObj = Country.getAllCountries().find(c =>
                    c.name === comp.long_name || c.isoCode === comp.short_name
                );
                if (countryObj) {
                    country = countryObj.isoCode;
                }
            }
        });

        // Fallback for city if not found in components
        if (!city && place.formatted_address) {
            const addressParts = place.formatted_address.split(',');
            if (addressParts.length > 1) {
                city = addressParts[addressParts.length - 2].trim();
            }
        }

        setLocationForm(prev => ({
            ...prev,
            title: title || prev.title,  // Use place name as title if available
            addressLine: `${streetNumber} ${route}`.trim(),
            city: city || prev.city,
            state: state || prev.state,
            country: country || prev.country,
            longitude: place.geometry.location.lng(),
            latitude: place.geometry.location.lat()
        }));
    };

    // Add these inside the component
    const handleCountryChange = (value: string) => {
        const country = Country.getCountryByCode(value);
        setLocationForm({
            ...locationForm,
            country: value,
            state: '',
            city: '',
            title: locationForm.title || country?.name || ''
        });
    };

    const handleStateChange = (value: string) => {
        const stateObj = State.getStateByCodeAndCountry(value, locationForm.country);
        setLocationForm({
            ...locationForm,
            state: value,
            city: '',
            title: locationForm.title || stateObj?.name || ''
        });
    };

    const handleCityChange = (value: string) => {
        setLocationForm({
            ...locationForm,
            city: value,
            title: locationForm.title || value || ''
        });
    };


    const handleVerify = () => {
        if (!companyId) return;
        verifyCompany.mutate(companyId, {
            onSuccess: () => {
                toast.success('Company verified successfully');
                refetch();
            },
            onError: (error) => {
                toast.error('Failed to verify company', {
                    description: error.message,
                });
            },
        });
    };

    const handleUnverifySubmit = () => {
        if (!companyId) return;

        unverifyCompany.mutate(
            {
                companyId,
                payload: {
                    unverifiedReason,
                    unverifiedReasonDescription,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Company unverified successfully');
                    setIsUnverifyDialogOpen(false);
                    setUnverifiedReason('');
                    setUnverifiedReasonDescription('');
                    refetch();
                },
                onError: (error) => {
                    toast.error('Failed to unverify company', {
                        description: error.message,
                    });
                },
            }
        );
    };

    const handleCreateLocation = () => {
        if (!companyId) return;

        // Transform country code to name before sending
        const countryName = Country.getCountryByCode(locationForm.country)?.name || locationForm.country;

        createLocation.mutate(
            {
                companyId,
                payload: {
                    ...locationForm,
                    country: countryName // Send country name instead of code
                }
            },
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
                        isAirportZone: false
                    });
                    refetchLocations();
                },
                onError: (error) => {
                    toast.error('Failed to create location', {
                        description: error.message,
                    });
                },
            }
        );
    };

    const handleUpdateLocation = () => {
        if (!currentLocation?.id) return;

        // Transform country code to name before sending
        const countryName = Country.getCountryByCode(locationForm.country)?.name || locationForm.country;

        updateLocation.mutate(
            {
                id: currentLocation.id,
                payload: {
                    ...locationForm,
                    country: countryName // Send country name instead of code
                }
            },
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
                        isAirportZone: false
                    });
                    refetchLocations();
                },
                onError: (error) => {
                    toast.error('Failed to update location', {
                        description: error.message,
                    });
                },
            }
        );
    };

    const handleToggleLocation = (id: string) => {
        toggleLocation.mutate(id, {
            onSuccess: () => {
                toast.success('Location status updated');
                refetchLocations();
            },
            onError: (error) => {
                toast.error('Failed to update location status', {
                    description: error.message,
                });
            },
        });
    };

    const openEditLocationDialog = (location: Location) => {
        setCurrentLocation(location);

        // Convert country name back to code when editing
        const countryCode = Country.getAllCountries().find(c =>
            c.name === location.country
        )?.isoCode || 'AE';

        setLocationForm({
            title: location.title,
            city: location.city,
            state: location.state,
            country: countryCode,
            addressLine: location.addressLine,
            longitude: parseFloat(location.longitude),
            latitude: parseFloat(location.latitude),
            isAirportZone: location.isAirportZone
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
                <p className="font-medium">{error.message}</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => refetch()}
                >
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
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{company.name}</h1>
                    <p className="text-muted-foreground">{company.description}</p>
                </div>

                <Badge
                    variant={company.isVerified ? 'default' : 'secondary'}
                    className="ml-2"
                >
                    {company.isVerified ? 'Verified' : 'Not Verified'}
                </Badge>
            </div>

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
                        {company.taxFile ? (
                            <div>
                                <p className="text-sm text-muted-foreground">Tax File</p>
                                <a
                                    href={company.taxFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center"
                                >
                                    View Tax File
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="ml-1"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-muted-foreground">Tax File</p>
                                <p className="text-muted-foreground">Not provided</p>
                            </div>
                        )}

                        {company.tradeLicenseFile ? (
                            <div>
                                <p className="text-sm text-muted-foreground">Trade License</p>
                                <a
                                    href={company.tradeLicenseFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center"
                                >
                                    View Trade License
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="ml-1"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-muted-foreground">Trade License</p>
                                <p className="text-muted-foreground">Not provided</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Locations Section with Accordion */}
            <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Locations</h2>
                    <Button
                        size="sm"
                        onClick={() => setIsLocationDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Location
                    </Button>
                </div>

                {/* Active Locations */}
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
                                                {location.isAirportZone && (
                                                    <Badge variant="default">Airport Zone</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm mt-1">
                                                {location.addressLine}, {location.city}, {location.state}, {location.country}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditLocationDialog(location)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleLocation(location.id)}
                                            >
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
                                                    <CompanyMap locations={[{
                                                        lat: parseFloat(location.latitude),
                                                        lng: parseFloat(location.longitude),
                                                        address: location.addressLine
                                                    }]} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inactive Locations */}
                {locations.inactiveLocations.length > 0 && (
                    <div>
                        <h3 className="font-medium mb-2">Inactive Locations</h3>
                        <div className="space-y-3">
                            {locations.inactiveLocations.map((location) => (
                                <div key={location.id} className="border rounded p-4 bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{location.title}</h4>
                                                {location.isAirportZone && (
                                                    <Badge variant="default">Airport Zone</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm mt-1">
                                                {location.addressLine}, {location.city}, {location.state}, {location.country}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Coordinates: {parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditLocationDialog(location)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleLocation(location.id)}
                                            >
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
                                                    <CompanyMap locations={[{
                                                        lat: parseFloat(location.latitude),
                                                        lng: parseFloat(location.longitude),
                                                        address: location.addressLine
                                                    }]} />
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

            {/* Operators Section */}
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
                                        <span className="text-xs text-muted-foreground">
                                            Last active: {format(new Date(operator.user.lastActivityAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Addresses Section */}
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
                                <p className="text-sm text-muted-foreground mt-2">
                                    {address.additionalInfo}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Verification Actions */}
            <div className="flex gap-2">
                {company.isVerified ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setIsUnverifyDialogOpen(true)}
                            disabled={unverifyCompany.isPending}
                        >
                            Unverify Company
                        </Button>

                        <Dialog open={isUnverifyDialogOpen} onOpenChange={setIsUnverifyDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Unverify Company</DialogTitle>
                                    <DialogDescription>
                                        Please provide a reason for unverifying this company.
                                    </DialogDescription>
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
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Short description of why you're unverifying this company
                                        </p>
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
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This will be visible to the company
                                        </p>
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
                                    <Button
                                        onClick={handleUnverifySubmit}
                                        disabled={
                                            unverifyCompany.isPending ||
                                            !unverifiedReason ||
                                            !unverifiedReasonDescription
                                        }
                                    >
                                        {unverifyCompany.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Confirm Unverification
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                ) : (
                    <Button
                        onClick={handleVerify}
                        disabled={verifyCompany.isPending}
                    >
                        {verifyCompany.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify Company
                    </Button>
                )}
            </div>

            {/* Add Location Dialog */}
            <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sticky top-0 bg-background">
                        <DialogTitle>Add New Location</DialogTitle>
                        <DialogDescription>
                            Note: Firstly Select the country , then fill Address field, so it show options and then it auto fill all the fields 
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={locationForm.title}
                                onChange={(e) => setLocationForm({ ...locationForm, title: e.target.value })}
                                placeholder={locationForm.city || locationForm.state || locationForm.country ?
                                    `e.g., ${locationForm.city || locationForm.state || Country.getCountryByCode(locationForm.country)?.name}` :
                                    "e.g., Main Office, Warehouse"
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
                                        setLocationForm(prev => ({
                                            ...prev,
                                            country: value,
                                            state: '',
                                            city: '',
                                            title: prev.title || countryObj?.name || ''
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
                                        setLocationForm(prev => ({
                                            ...prev,
                                            state: value,
                                            city: '',
                                            title: prev.title || stateObj?.name || ''
                                        }));
                                    }}
                                    disabled={!stateList.length}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={stateList.length ? "Select state" : "No states available"} />
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
                                        setLocationForm(prev => ({
                                            ...prev,
                                            city: value,
                                            title: prev.title || value || ''
                                        }));
                                    }}
                                    disabled={!cityList.length}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={cityList.length ? "Select city" : "No cities available"} />
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
                                locations={[{
                                    lat: locationForm.latitude,
                                    lng: locationForm.longitude,
                                    address: locationForm.addressLine
                                }]}
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
                        <Button
                            variant="outline"
                            onClick={() => setIsLocationDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateLocation}
                            disabled={createLocation.isPending || !locationForm.title || !locationForm.addressLine}
                        >
                            {createLocation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
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
                        <DialogDescription>
                            Update the details for this location
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="edit-title">Title *</Label>
                            <Input
                                id="edit-title"
                                value={locationForm.title}
                                onChange={(e) => setLocationForm({ ...locationForm, title: e.target.value })}
                                placeholder={locationForm.city || locationForm.state || locationForm.country ?
                                    `e.g., ${locationForm.city || locationForm.state || Country.getCountryByCode(locationForm.country)?.name}` :
                                    "e.g., Main Office, Warehouse"
                                }
                            />
                        </div>

                        <div>
                            <Label>Address *</Label>
                            {/* In the Edit Location Dialog */}
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
                                <Select
                                    value={locationForm.country}
                                    onValueChange={handleCountryChange}
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
                                    onValueChange={handleStateChange}
                                    disabled={!stateList.length}
                                >

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
                                <Select
                                    value={locationForm.city}
                                    onValueChange={handleCityChange}
                                    disabled={!cityList.length}
                                >
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
                                locations={[{
                                    lat: locationForm.latitude,
                                    lng: locationForm.longitude,
                                    address: locationForm.addressLine
                                }]}
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
                        <Button
                            variant="outline"
                            onClick={() => setIsEditLocationDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateLocation}
                            disabled={updateLocation.isPending || !locationForm.title || !locationForm.addressLine}
                        >
                            {updateLocation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Update Location
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CompanyDetail;