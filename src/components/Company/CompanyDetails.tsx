// src/components/Company/CompanyDetails.tsx

import { useState, useEffect, useRef } from 'react';
import { useGetCompany, useUnverifyCompany, useVerifyCompany } from '@/hooks/useCompanyApi';
import { queryClient } from '@/Provider';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  useGetCompanySettings,
  useGetPlanConfigs,
  useEnsureDefaultPlans,
  useSetCommissionOverride,
  useStartCompanySubscription,
  useDeleteCommissionOverride,
  useEndCompanySubscriptionEarly,
  useSetStatusCommissionSettings,
  useSetFixedCancellationAmounts,
  useSetEdgeCaseHandling,
} from '@/hooks/usePlansApi';
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
import {
  Loader2,
  Plus,
  MapPin,
  Search,
  ChevronDown,
  Crown,
  Gem,
  Diamond as DiamondIcon,
  Medal,
  Key,
  Sparkles,
  Info,
  Check,
  Edit,
} from 'lucide-react';
import { useGetLocations, useCreateLocation, useUpdateLocation, useToggleLocation, useCheckLocationKey, useSuggestLocationKeys } from '@/hooks/useLocationApi';
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
import { StatusCommissionSettingsPayload, StatusCommissionSetting, FixedCancellationAmountsPayload, CompanySettingsPayload, EdgeCaseHandlingPayload } from '@/types/company';

type Tier = 'BASIC' | 'GOLD' | 'PREMIUM' | 'DIAMOND';

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

const TIER_META: Record<Tier, { label: string; Icon: any; color: string }> = {
  BASIC: { label: 'Basic', Icon: Medal, color: 'text-muted-foreground' },
  GOLD: { label: 'Gold', Icon: Crown, color: 'text-[#F56304]' },
  PREMIUM: { label: 'Premium', Icon: Gem, color: 'text-purple-600' },
  DIAMOND: { label: 'Diamond', Icon: DiamondIcon, color: 'text-cyan-600' },
};

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
          <ul className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                className="px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                onMouseDown={() => handleSelectSuggestion(suggestion)}
              >
                <div className="font-medium text-foreground">{suggestion.structured_formatting.main_text}</div>
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

// Status Commission Settings Form Component
interface StatusCommissionSettingsFormProps {
  currentSettings?: {
    COMPLETED?: StatusCommissionSetting | null;
    LATE_CANCEL?: StatusCommissionSetting | null;
    NO_SHOW?: StatusCommissionSetting | null;
    CUSTOMER_FAULT?: StatusCommissionSetting | null;
    OPERATOR_FAULT?: StatusCommissionSetting | null;
    FREE_CANCEL?: StatusCommissionSetting | null;
    // PARTIAL_USE?: StatusCommissionSetting | null;
  };
  onSave: (payload: StatusCommissionSettingsPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const StatusCommissionSettingsForm: React.FC<StatusCommissionSettingsFormProps> = ({
  currentSettings,
  onSave,
  onCancel,
  isLoading,
}) => {
  const statusTypes = [
    { key: 'COMPLETED', label: 'Completed', supportsSplit: false },
    { key: 'LATE_CANCEL', label: 'Late Cancel', supportsSplit: true },
    { key: 'NO_SHOW', label: 'No Show', supportsSplit: true },
    { key: 'CUSTOMER_FAULT', label: 'Customer Fault', supportsSplit: true },
    { key: 'OPERATOR_FAULT', label: 'Operator Fault', supportsSplit: false },
    // { key: 'FREE_CANCEL', label: 'Free Cancel', supportsSplit: false },
    // { key: 'PARTIAL_USE', label: 'Partial Use', supportsSplit: true },
  ] as const;

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Initialize form data from current settings
    const initialData: Record<string, any> = {};
    const statusTypesList = [
      { key: 'COMPLETED', label: 'Completed', supportsSplit: false },
      { key: 'LATE_CANCEL', label: 'Late Cancel', supportsSplit: true },
      { key: 'NO_SHOW', label: 'No Show', supportsSplit: true },
      { key: 'CUSTOMER_FAULT', label: 'Customer Fault', supportsSplit: true },
      { key: 'OPERATOR_FAULT', label: 'Operator Fault', supportsSplit: false },
      // { key: 'FREE_CANCEL', label: 'Free Cancel', supportsSplit: false },
      // { key: 'PARTIAL_USE', label: 'Partial Use', supportsSplit: true },
    ] as const;
    statusTypesList.forEach(({ key }) => {
      const current = currentSettings?.[key as keyof typeof currentSettings];
      if (current) {
        initialData[key] = {
          type: current.type || 'PERCENTAGE',
          percentageRate: current.percentageRate || '',
          fixedAmount: current.fixedAmount || '',
          splitPercentage: current.splitPercentage || '',
          penaltyPercentage: current.penaltyPercentage || '',
          yalaRidePercentage: current.yalaRidePercentage || '',
        };
      } else {
        initialData[key] = {
          type: 'PERCENTAGE',
          percentageRate: '',
          fixedAmount: '',
          splitPercentage: '',
          penaltyPercentage: '',
          yalaRidePercentage: '',
        };
      }
    });
    setFormData(initialData);
  }, [currentSettings]);

  const handleStatusChange = (status: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    const payload: StatusCommissionSettingsPayload = {};

    statusTypes.forEach(({ key }) => {
      const data = formData[key];
      if (!data) return;

      if (key === 'OPERATOR_FAULT') {
        if (data.type === 'PERCENTAGE' && data.penaltyPercentage) {
          payload.OPERATOR_FAULT = {
            type: 'PERCENTAGE',
            penaltyPercentage: parseFloat(data.penaltyPercentage),
            yalaRidePercentage: data.yalaRidePercentage ? parseFloat(data.yalaRidePercentage) : 100,
          };
        } else if (data.type === 'FIXED' && data.fixedAmount) {
          payload.OPERATOR_FAULT = {
            type: 'FIXED',
            fixedAmount: parseFloat(data.fixedAmount),
            yalaRidePercentage: data.yalaRidePercentage ? parseFloat(data.yalaRidePercentage) : 100,
          };
        }
      } else if (key === 'NO_SHOW') {
        // NO_SHOW: Special case
        // PERCENTAGE: percentageRate + splitPercentage
        // FIXED: percentageRate + fixedAmount
        if (data.type === 'PERCENTAGE' && data.percentageRate && data.splitPercentage) {
          payload.NO_SHOW = {
            type: 'PERCENTAGE',
            percentageRate: parseFloat(data.percentageRate),
            splitPercentage: parseFloat(data.splitPercentage),
          };
        } else if (data.type === 'FIXED' && data.percentageRate && data.fixedAmount) {
          payload.NO_SHOW = {
            type: 'FIXED',
            percentageRate: parseFloat(data.percentageRate),
            fixedAmount: parseFloat(data.fixedAmount),
          };
        }
      } else {
        // COMPLETED, LATE_CANCEL, CUSTOMER_FAULT, PARTIAL_USE
        if (data.type === 'PERCENTAGE' && data.percentageRate) {
          payload[key as keyof StatusCommissionSettingsPayload] = {
            type: 'PERCENTAGE',
            percentageRate: parseFloat(data.percentageRate),
            // Split only for non-COMPLETED statuses
            splitPercentage: key !== 'COMPLETED' && data.splitPercentage ? parseFloat(data.splitPercentage) : undefined,
          };
        } else if (data.type === 'FIXED' && data.fixedAmount) {
          payload[key as keyof StatusCommissionSettingsPayload] = {
            type: 'FIXED',
            fixedAmount: parseFloat(data.fixedAmount),
            // Split only for non-COMPLETED statuses
            splitPercentage: key !== 'COMPLETED' && data.splitPercentage ? parseFloat(data.splitPercentage) : undefined,
          };
        }
      }
    });

    onSave(payload);
  };

  return (
    <div className="space-y-6 py-4">
      {statusTypes.map(({ key, label, supportsSplit }) => {
        const data = formData[key] || {};
        const isOperatorFault = key === 'OPERATOR_FAULT';
        const isNoShow = key === 'NO_SHOW';
        // const isFreeCancel = key === 'FREE_CANCEL';

        return (
          <div key={key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">{label}</h4>

            </div>

            <div className="space-y-4">
              {data.type !== null ? (
                <>
                  <div>
                    <Label>Commission Type</Label>
                    <Select
                      value={data.type || 'PERCENTAGE'}
                      onValueChange={(value) => handleStatusChange(key, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isOperatorFault ? (
                    <>
                      {data.type === 'PERCENTAGE' ? (
                        <div>
                          <Label>Penalty Percentage *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="100"
                            value={data.penaltyPercentage || ''}
                            onChange={(e) => handleStatusChange(key, 'penaltyPercentage', e.target.value)}
                            placeholder="e.g., 25"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>Fixed Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.fixedAmount || ''}
                            onChange={(e) => handleStatusChange(key, 'fixedAmount', e.target.value)}
                            placeholder="e.g., 50.00"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label>YalaRide Percentage (Optional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={data.yalaRidePercentage || ''}
                          onChange={(e) => handleStatusChange(key, 'yalaRidePercentage', e.target.value)}
                          placeholder="e.g., 50 (default: 100)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">YalaRide share of penalty (0-100)</p>
                      </div>
                    </>
                  ) : isNoShow ? (
                    <>
                      {/* NO_SHOW: Special case - always needs percentageRate + one other field */}
                      <div>
                        <Label>Percentage Rate *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="100"
                          value={data.percentageRate || ''}
                          onChange={(e) => handleStatusChange(key, 'percentageRate', e.target.value)}
                          placeholder="e.g., 10"
                        />
                      </div>
                      
                      {data.type === 'PERCENTAGE' ? (
                        <div>
                          <Label>Split Percentage *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={data.splitPercentage || ''}
                            onChange={(e) => handleStatusChange(key, 'splitPercentage', e.target.value)}
                            placeholder="e.g., 50"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Split between YalaRide and Company (0-100)</p>
                        </div>
                      ) : (
                        <div>
                          <Label>Fixed Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.fixedAmount || ''}
                            onChange={(e) => handleStatusChange(key, 'fixedAmount', e.target.value)}
                            placeholder="e.g., 6.00"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {data.type === 'PERCENTAGE' ? (
                        <div>
                          <Label>Percentage Rate *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="100"
                            value={data.percentageRate || ''}
                            onChange={(e) => handleStatusChange(key, 'percentageRate', e.target.value)}
                            placeholder="e.g., 10"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>Fixed Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.fixedAmount || ''}
                            onChange={(e) => handleStatusChange(key, 'fixedAmount', e.target.value)}
                            placeholder="e.g., 6.00"
                          />
                        </div>
                      )}

                      {supportsSplit && (
                        <div>
                          <Label>Split Percentage (Optional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={data.splitPercentage || ''}
                            onChange={(e) => handleStatusChange(key, 'splitPercentage', e.target.value)}
                            placeholder="e.g., 50 (default: 50)"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Split between YalaRide and Company (0-100)</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No commission configured for this status.</p>
              )}
            </div>
          </div>
        );
      })}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-[#F56304] hover:bg-[#F56304]/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

// Fixed Cancellation Amounts Form Component
interface FixedCancellationAmountsFormProps {
  currentSettings?: CompanySettingsPayload;
  onSave: (payload: FixedCancellationAmountsPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const FixedCancellationAmountsForm: React.FC<FixedCancellationAmountsFormProps> = ({
  currentSettings,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [useGlobalAmount, setUseGlobalAmount] = useState(false);
  const [globalAmount, setGlobalAmount] = useState<string>('');
  const [lateCancel, setLateCancel] = useState<string>('');
  const [noShow, setNoShow] = useState<string>('');
  const [customerFault, setCustomerFault] = useState<string>('');
  const [partialUse, setPartialUse] = useState<string>('');

  useEffect(() => {
    // Initialize form data from current settings
    if (currentSettings) {
      if (currentSettings.fixedCancellationAmount) {
        setUseGlobalAmount(true);
        setGlobalAmount(currentSettings.fixedCancellationAmount);
      } else {
        setUseGlobalAmount(false);
        setLateCancel(currentSettings.fixedCancellationAmountLateCancel || '');
        setNoShow(currentSettings.fixedCancellationAmountNoShow || '');
        setCustomerFault(currentSettings.fixedCancellationAmountCustomerFault || '');
        setPartialUse(currentSettings.fixedCancellationAmountPartialUse || '');
      }
    }
  }, [currentSettings]);

  const handleSave = () => {
    const payload: FixedCancellationAmountsPayload = {};

    if (useGlobalAmount) {
      if (!globalAmount || parseFloat(globalAmount) < 0.01) {
        toast.error('Global amount must be at least 0.01');
        return;
      }
      payload.useAllAmount = parseFloat(globalAmount);
    } else {
      // Per-type amounts
      if (lateCancel && parseFloat(lateCancel) >= 0.01) {
        payload.lateCancel = parseFloat(lateCancel);
      }
      if (noShow && parseFloat(noShow) >= 0.01) {
        payload.noShow = parseFloat(noShow);
      }
      if (customerFault && parseFloat(customerFault) >= 0.01) {
        payload.customerFault = parseFloat(customerFault);
      }
      if (partialUse && parseFloat(partialUse) >= 0.01) {
        payload.partialUse = parseFloat(partialUse);
      }

      // Check if at least one amount is provided
      if (Object.keys(payload).length === 0) {
        toast.error('Please provide at least one amount');
        return;
      }
    }

    onSave(payload);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={useGlobalAmount}
          onCheckedChange={setUseGlobalAmount}
        />
        <Label>Use Global Amount for All Types</Label>
      </div>

      {useGlobalAmount ? (
        <div>
          <Label>Global Fixed Amount *</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={globalAmount}
            onChange={(e) => setGlobalAmount(e.target.value)}
            placeholder="e.g., 8.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This amount will be used for all cancellation types (LATE_CANCEL, NO_SHOW, CUSTOMER_FAULT, PARTIAL_USE)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Late Cancel Amount (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={lateCancel}
              onChange={(e) => setLateCancel(e.target.value)}
              placeholder="e.g., 8.00"
            />
          </div>

          <div>
            <Label>No Show Amount (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={noShow}
              onChange={(e) => setNoShow(e.target.value)}
              placeholder="e.g., 6.00"
            />
          </div>

          <div>
            <Label>Customer Fault Amount (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={customerFault}
              onChange={(e) => setCustomerFault(e.target.value)}
              placeholder="e.g., 10.00"
            />
          </div>

          <div>
            <Label>Partial Use Amount (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={partialUse}
              onChange={(e) => setPartialUse(e.target.value)}
              placeholder="e.g., 5.00"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Set individual amounts for each cancellation type. At least one amount must be provided.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-[#F56304] hover:bg-[#F56304]/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Amounts'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

// Edge Case Handling Form Component
interface EdgeCaseHandlingFormProps {
  currentValue: 'CAP' | 'OWE';
  onSave: (payload: EdgeCaseHandlingPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EdgeCaseHandlingForm: React.FC<EdgeCaseHandlingFormProps> = ({
  currentValue,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [edgeCaseHandling, setEdgeCaseHandling] = useState<'CAP' | 'OWE'>(currentValue);

  useEffect(() => {
    setEdgeCaseHandling(currentValue);
  }, [currentValue]);

  const handleSave = () => {
    onSave({ edgeCaseHandling });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div>
          <Label>Edge Case Handling Method</Label>
          <Select
            value={edgeCaseHandling}
            onValueChange={(value: 'CAP' | 'OWE') => setEdgeCaseHandling(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAP">CAP - Commission Capped at Penalty Amount</SelectItem>
              <SelectItem value="OWE">OWE - Company Owes Difference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">What is Edge Case?</p>
          <p className="text-xs text-muted-foreground">
            When fixed cancellation amount is greater than the penalty amount.
          </p>
          <div className="mt-3 space-y-2">
            <div>
              <p className="text-xs font-medium">CAP Mode:</p>
              <p className="text-xs text-muted-foreground">
                Commission is capped at the penalty amount. Company doesn't owe extra.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium">OWE Mode:</p>
              <p className="text-xs text-muted-foreground">
                Company owes the difference (tracked in amountOwed field).
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-[#F56304] hover:bg-[#F56304]/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: companyData, isLoading, error, refetch } = useGetCompany(companyId || '');
  const { data: locationsData, refetch: refetchLocations } = useGetLocations(companyId || '');
  const verifyCompany = useVerifyCompany();
  const unverifyCompany = useUnverifyCompany();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const toggleLocation = useToggleLocation();
  const { mutate: getLocationSuggestions, isPending: isSuggestingLocation } = useSuggestLocationKeys();

  const [isUnverifyDialogOpen, setIsUnverifyDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isEditLocationDialogOpen, setIsEditLocationDialogOpen] = useState(false);
  const [isStatusCommissionDialogOpen, setIsStatusCommissionDialogOpen] = useState(false);
  const [isFixedCancellationDialogOpen, setIsFixedCancellationDialogOpen] = useState(false);
  const [isEdgeCaseHandlingDialogOpen, setIsEdgeCaseHandlingDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [unverifiedReason, setUnverifiedReason] = useState('');
  const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');
  const [, setGoogleMapsLoaded] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const countryList = Country.getAllCountries();

  // Stable id before company fetch resolves
  const safeCompanyId = companyId || '';

  const { data: settingsRes, refetch: refetchSettings, isLoading: settingsLoading } = useGetCompanySettings(safeCompanyId);
  const ensureDefaults = useEnsureDefaultPlans();

  const setStatusCommissionSettings = useSetStatusCommissionSettings(safeCompanyId);
  const setFixedCancellationAmounts = useSetFixedCancellationAmounts(safeCompanyId);
  const setEdgeCaseHandling = useSetEdgeCaseHandling(safeCompanyId);

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

    const s = settingsRes?.data?.settings;
    if (!s) return;

    if (s.currentTier) setSelectedTier(s.currentTier);

    // Only populate the inputs if the override is still active
    const apiHasActiveOverride =
      !!s.overrideCommissionRate &&
      !!s.overrideEndsAt &&
      new Date(s.overrideEndsAt).getTime() > Date.now();

    if (apiHasActiveOverride) {
      setOverrideRate(s.overrideCommissionRate != null ? String(s.overrideCommissionRate) : '');
      setOverrideEndsAt(s.overrideEndsAt ?? '');
    } else {
      // clear inputs when there’s no active override (or it just expired)
      setOverrideRate('');
      setOverrideEndsAt('');
    }
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
    locationKey: '',
  });

  // Check location key availability
  const { data: locationKeyCheckData, isLoading: isCheckingLocationKey } = useCheckLocationKey(
    locationForm.locationKey.length >= 2 && locationForm.locationKey.length <= 3 ? locationForm.locationKey : ''
  );

  // Load Google Maps API
  useEffect(() => {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

    // Build address line: prefer street_number + route, fallback to formatted_address or name
    let addressLine = `${streetNumber} ${route}`.trim();
    if (!addressLine || addressLine.length === 0) {
      // If no street number/route, use formatted_address or name as fallback
      addressLine = place.formatted_address || place.name || '';
    }

    setLocationForm((prev) => ({
      ...prev,
      title: title || prev.title,
      addressLine: addressLine || prev.addressLine,
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
      onError: (err) => toast.error('Failed to verify company', { description: (err as any).message }),
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
        onError: (err) => toast.error('Failed to unverify company', { description: (err as any).message }),
      }
    );
  };

  // is an override actually active right now?
  const hasActiveOverride =
    !!settingsRes?.data.settings.overrideCommissionRate &&
    !!settingsRes?.data.settings.overrideEndsAt &&
    new Date(settingsRes.data.settings.overrideEndsAt).getTime() > Date.now();

  // Handle location key input with auto-capitalization
  const handleLocationKeyChange = (value: string) => {
    // Remove non-alphabetic characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z]/g, '').toUpperCase();
    // Limit to 3 characters
    const limited = cleaned.slice(0, 3);
    setLocationForm({ ...locationForm, locationKey: limited });
  };

  // Get suggestions for location key
  const handleGetLocationSuggestions = () => {
    if (showLocationSuggestions && locationSuggestions.length > 0) {
      setShowLocationSuggestions(false);
      return;
    }
    
    if (!companyId) {
      toast.error('Company ID is required');
      return;
    }
    
    if (!locationForm.title || locationForm.title.trim().length === 0) {
      toast.error('Please enter a location title first');
      return;
    }
    
    getLocationSuggestions({ 
      locationName: locationForm.title.trim(),
      companyId: companyId 
    }, {
      onSuccess: (response) => {
        setLocationSuggestions(response.suggestions || []);
        setShowLocationSuggestions(true);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to get suggestions';
        toast.error(errorMessage);
      }
    });
  };

  // Select a location suggestion
  const handleSelectLocationSuggestion = (suggestion: string) => {
    setLocationForm({ ...locationForm, locationKey: suggestion });
    setShowLocationSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-key-suggestions') && 
          !target.closest('#locationKey') &&
          !target.closest('button[type="button"]')?.closest('.relative')) {
        setShowLocationSuggestions(false);
      }
    };
    if (showLocationSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLocationSuggestions]);

  const handleCreateLocation = () => {
    if (!companyId) return;
    
    // Validate location key
    if (!locationForm.locationKey || locationForm.locationKey.length < 2 || locationForm.locationKey.length > 3) {
      toast.error('Location key must be 2-3 uppercase letters');
      return;
    }
    
    if (locationKeyCheckData?.available === false) {
      toast.error('Please choose an available location key');
      return;
    }
    
    const countryName = Country.getCountryByCode(locationForm.country)?.name || locationForm.country;
    createLocation.mutate(
      { companyId, payload: { ...locationForm, country: countryName, locationKey: locationForm.locationKey.toUpperCase() } },
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
            locationKey: '',
          });
          setShowLocationSuggestions(false);
          setLocationSuggestions([]);
          refetchLocations();
        },
        onError: (err: any) => {
          const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create location';
          toast.error(errorMessage);
        },
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
            locationKey: '',
          });
          setShowLocationSuggestions(false);
          setLocationSuggestions([]);
          refetchLocations();
        },
        onError: (err: any) => {
          const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update location';
          toast.error(errorMessage);
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
      onError: (err) => toast.error('Failed to update location status', { description: (err as any).message }),
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
      locationKey: (location as any).locationKey || '',
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
                <a
                  href={company.taxFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F56304] hover:underline inline-flex items-center"
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
              ) : (
                <p className="text-muted-foreground">Not provided</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Trade License</p>
              {company.tradeLicenseFile ? (
                <a
                  href={company.tradeLicenseFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F56304] hover:underline inline-flex items-center"
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
          <Button size="sm" onClick={() => setIsLocationDialogOpen(true)} className="bg-[#F56304] hover:bg-[#F56304]/90 text-white">
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
      {/* <div className="border rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Plans & Commission</h2>
          <div className="flex flex-wrap items-center gap-2">
            <TierBadgeInline tier={settingsRes?.data.settings.currentTier} />
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
                    Now
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
                className="min-w-[160px] bg-[#F56304] hover:bg-[#F56304]/90 text-white"
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
                      onError: (err) => toast.error('Failed to start subscription', { description: (err as any).message }),
                    }
                  );
                }}
              >
                {startSub.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {subscriptionMode === 'startNow' ? 'Start subscription' : 'Queue subscription'}
              </Button>
              {planLoading && <span className="text-xs text-muted-foreground">Loading plans…</span>}
            </div>

            <div className="mt-4 space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Current Subscription — End Early</p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={endEarly.isPending}
                  onClick={() =>
                    endEarly.mutate(
                      { action: 'START_NEXT_SCHEDULED', note: subscriptionNote || undefined },
                      {
                        onSuccess: (r: any) => {
                          toast.success('Started next scheduled tier', { description: r?.data?.message });
                          refetchSettings();
                        },
                        onError: (err) => toast.error('Failed', { description: (err as any).message }),
                      }
                    )
                  }
                >
                  {endEarly.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  End now & start queued
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={endEarly.isPending}
                  onClick={() =>
                    endEarly.mutate(
                      { action: 'REVERT_TO_BASE', note: subscriptionNote || 'pause plan' },
                      {
                        onSuccess: (r: any) => {
                          toast.success('Reverted to base tier', { description: r?.data?.message });
                          refetchSettings();
                        },
                        onError: (err) => toast.error('Failed', { description: (err as any).message }),
                      }
                    )
                  }
                >
                  Revert to base
                </Button>
              </div>
            </div>
          </div>

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
                <Label className="text-sm">Override Ends Date</Label>
                <Input
                  type="datetime-local"
                  min={nowLocalInputValue()}
                  value={toLocalInputValue(overrideEndsAt)}
                  onChange={(e) => {
                    const fixedLocal = clampToFutureLocal(e.target.value);
                    if (fixedLocal !== e.target.value) {
                      toast.info('Override end time adjusted to the next minute.');
                    }
                    setOverrideEndsAt(fromLocalInputValueToISO(fixedLocal));
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                className="bg-[#F56304] hover:bg-[#F56304]/90 text-white"
                disabled={setOverride.isPending || !overrideRate || !overrideEndsAt}
                onClick={() => {
                  const rateNum = Number(overrideRate);
                  if (Number.isNaN(rateNum) || rateNum <= 0) {
                    toast.error('Enter a valid override rate > 0');
                    return;
                  }
                  const endsAtDate = new Date(overrideEndsAt);
                  const now = new Date();
                  if (endsAtDate.getTime() <= now.getTime()) {
                    toast.error('Override end time must be in the future.');
                    setOverrideEndsAt(fromLocalInputValueToISO(nowLocalInputValue()));
                    return;
                  }

                  setOverride.mutate(
                    { rate: rateNum, endsAt: overrideEndsAt },
                    {
                      onSuccess: () => {
                        toast.success('Override applied');
                        refetchSettings();
                      },
                      onError: (err) => toast.error('Failed to set override', { description: (err as any).message }),
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
                disabled={!hasActiveOverride || deleteOverride.isPending}
                onClick={() => {
                  if (!hasActiveOverride) return;
                  deleteOverride.mutate(undefined, {
                    onSuccess: () => {
                      toast.success('Override expired');
                      setOverrideRate('');   // clear immediately
                      setOverrideEndsAt(''); // clear date-time field
                      refetchSettings();
                    },
                    onError: (err) =>
                      toast.error('Failed to expire override', { description: (err as any).message }),
                  });
                }}
              >
                {deleteOverride.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Expire now
              </Button>

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
      </div> */}

      {/* Commission Settings Details */}
      {settingsRes?.data?.settings && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Commission Settings</h2>
          
          {/* Basic Commission Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Base Commission Rate</p>
              <p className="font-medium">{settingsRes.data.baseCommissionRate || '—'}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Effective Commission</p>
              <p className="font-medium">{settingsRes.data.settings.effectiveCommissionRate || '—'}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Source</p>
              <p className="font-medium">{settingsRes.data.settings.commissionSource || 'BASE'}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Edge Case Handling</p>
                <p className="font-medium">{settingsRes.data.settings.edgeCaseHandling || 'OWE'}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEdgeCaseHandlingDialogOpen(true)}
                className="bg-[#F56304] hover:bg-[#F56304]/90 text-white border-[#F56304]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          {/* Fixed Cancellation Amounts */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Fixed Cancellation Amounts</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFixedCancellationDialogOpen(true)}
                className="bg-[#F56304] hover:bg-[#F56304]/90 text-white border-[#F56304]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Amounts
              </Button>
            </div>
            {(settingsRes.data.settings.fixedCancellationAmount || 
              settingsRes.data.settings.fixedCancellationAmountLateCancel ||
              settingsRes.data.settings.fixedCancellationAmountNoShow ||
              settingsRes.data.settings.fixedCancellationAmountCustomerFault ||
              settingsRes.data.settings.fixedCancellationAmountPartialUse) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsRes.data.settings.fixedCancellationAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Global Fixed Amount</p>
                    <p className="font-medium">${settingsRes.data.settings.fixedCancellationAmount}</p>
                  </div>
                )}
                {settingsRes.data.settings.fixedCancellationAmountLateCancel && (
                  <div>
                    <p className="text-sm text-muted-foreground">Late Cancel</p>
                    <p className="font-medium">${settingsRes.data.settings.fixedCancellationAmountLateCancel}</p>
                  </div>
                )}
                {settingsRes.data.settings.fixedCancellationAmountNoShow && (
                  <div>
                    <p className="text-sm text-muted-foreground">No Show</p>
                    <p className="font-medium">${settingsRes.data.settings.fixedCancellationAmountNoShow}</p>
                  </div>
                )}
                {settingsRes.data.settings.fixedCancellationAmountCustomerFault && (
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Fault</p>
                    <p className="font-medium">${settingsRes.data.settings.fixedCancellationAmountCustomerFault}</p>
                  </div>
                )}
                {settingsRes.data.settings.fixedCancellationAmountPartialUse && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partial Use</p>
                    <p className="font-medium">${settingsRes.data.settings.fixedCancellationAmountPartialUse}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fixed cancellation amounts configured</p>
            )}
          </div>

          {/* Status Commission Settings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Status-Based Commission Settings</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStatusCommissionDialogOpen(true)}
                className="bg-[#F56304] hover:bg-[#F56304]/90 text-white border-[#F56304]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Settings
              </Button>
            </div>
            {settingsRes.data.settings.statusCommissionSettings && (
              <div className="space-y-3">
                {Object.entries(settingsRes.data.settings.statusCommissionSettings).map(([status, setting]) => {
                  if (!setting) return null;
                  return (
                    <div key={status} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium capitalize">{status.replace(/_/g, ' ')}</p>
                        <Badge variant="outline">{setting.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {setting.percentageRate !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Rate</p>
                            <p className="font-medium">{setting.percentageRate}%</p>
                          </div>
                        )}
                        {setting.fixedAmount !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Fixed Amount</p>
                            <p className="font-medium">${setting.fixedAmount}</p>
                          </div>
                        )}
                        {status !== 'COMPLETED' && setting.splitPercentage !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Split</p>
                            <p className="font-medium">{setting.splitPercentage}%</p>
                          </div>
                        )}
                        {setting.penaltyPercentage !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Penalty</p>
                            <p className="font-medium">{setting.penaltyPercentage}%</p>
                          </div>
                        )}
                        {setting.yalaRidePercentage !== undefined && (
                          <div>
                            <p className="text-muted-foreground">YalaRide</p>
                            <p className="font-medium">{setting.yalaRidePercentage}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edge Case Handling Dialog */}
      <Dialog open={isEdgeCaseHandlingDialogOpen} onOpenChange={setIsEdgeCaseHandlingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Edge Case Handling</DialogTitle>
            <DialogDescription>
              Set how to handle edge cases when fixed cancellation amount is greater than penalty amount.
            </DialogDescription>
          </DialogHeader>

          <EdgeCaseHandlingForm
            currentValue={settingsRes?.data?.settings?.edgeCaseHandling || 'OWE'}
            onSave={(payload) => {
              setEdgeCaseHandling.mutate(payload, {
                onSuccess: () => {
                  toast.success('Edge case handling updated successfully');
                  refetchSettings();
                  setIsEdgeCaseHandlingDialogOpen(false);
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update edge case handling';
                  toast.error(errorMessage);
                },
              });
            }}
            onCancel={() => setIsEdgeCaseHandlingDialogOpen(false)}
            isLoading={setEdgeCaseHandling.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Fixed Cancellation Amounts Dialog */}
      <Dialog open={isFixedCancellationDialogOpen} onOpenChange={setIsFixedCancellationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fixed Cancellation Amounts</DialogTitle>
            <DialogDescription>
              Set fixed cancellation amounts. You can set one global amount for all types or separate amounts per type.
              Note: Company must have FIXED commission type to use this feature.
            </DialogDescription>
          </DialogHeader>

          <FixedCancellationAmountsForm
            currentSettings={settingsRes?.data?.settings}
            onSave={(payload) => {
              setFixedCancellationAmounts.mutate(payload, {
                onSuccess: () => {
                  toast.success('Fixed cancellation amounts updated successfully');
                  refetchSettings();
                  setIsFixedCancellationDialogOpen(false);
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update amounts';
                  toast.error(errorMessage);
                },
              });
            }}
            onCancel={() => setIsFixedCancellationDialogOpen(false)}
            isLoading={setFixedCancellationAmounts.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Status Commission Settings Dialog */}
      <Dialog open={isStatusCommissionDialogOpen} onOpenChange={setIsStatusCommissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Status Commission Settings</DialogTitle>
            <DialogDescription>
              Configure commission settings for each booking status. You can set different commission types and rates per status.
            </DialogDescription>
          </DialogHeader>

          <StatusCommissionSettingsForm
            currentSettings={settingsRes?.data?.settings?.statusCommissionSettings}
            onSave={(payload) => {
              setStatusCommissionSettings.mutate(payload, {
                onSuccess: () => {
                  toast.success('Status commission settings updated successfully');
                  refetchSettings();
                  setIsStatusCommissionDialogOpen(false);
                },
                onError: (error: any) => {
                  const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update settings';
                  toast.error(errorMessage);
                },
              });
            }}
            onCancel={() => setIsStatusCommissionDialogOpen(false)}
            isLoading={setStatusCommissionSettings.isPending}
          />
        </DialogContent>
      </Dialog>

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
                  <Button onClick={handleUnverifySubmit} disabled={unverifyCompany.isPending || !unverifiedReason || !unverifiedReasonDescription} className="bg-[#F56304] hover:bg-[#F56304]/90 text-white">
                    {unverifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Unverification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Button onClick={handleVerify} disabled={verifyCompany.isPending} className="bg-[#F56304] hover:bg-[#F56304]/90 text-white">
            {verifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Company
          </Button>
        )}
      </div>

      {/* Add Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>Note: Select the country first, then type the address—fields will auto-fill.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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

            {/* Location Key */}
            <div className="space-y-2 relative">
              <Label htmlFor="locationKey" className="flex items-center gap-1">
                <Key className="h-4 w-4" />
                Location Key
                <span className="text-destructive">*</span>
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded text-xs whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none">
                      2-3 uppercase letters (e.g., ABC, XY)
                    </div>
                  </div>
                </div>
              </Label>
              <div className="relative">
                <Input
                  id="locationKey"
                  type="text"
                  placeholder="ABC"
                  value={locationForm.locationKey}
                  onChange={(e) => handleLocationKeyChange(e.target.value)}
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
                  onClick={handleGetLocationSuggestions}
                  disabled={!locationForm.title || locationForm.title.trim().length === 0 || isSuggestingLocation}
                  title={!locationForm.title || locationForm.title.trim().length === 0 ? 'Enter location title first' : 'Get suggestions'}
                >
                  {isSuggestingLocation ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {locationForm.locationKey.length >= 2 && locationForm.locationKey.length <= 3 && (
                <div className="flex items-center gap-2">
                  {isCheckingLocationKey ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking availability...
                    </span>
                  ) : locationKeyCheckData?.available === false ? (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      This key is already taken
                    </span>
                  ) : locationKeyCheckData?.available === true ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Available
                    </span>
                  ) : null}
                </div>
              )}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="location-key-suggestions absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-auto">
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-2 px-2">Suggestions:</p>
                    {locationSuggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className="px-3 py-2 hover:bg-accent cursor-pointer rounded flex items-center justify-between transition-colors"
                        onMouseDown={() => handleSelectLocationSuggestion(suggestion)}
                      >
                        <span className="font-medium uppercase text-foreground">{suggestion}</span>
                        <button
                          type="button"
                          onClick={() => handleSelectLocationSuggestion(suggestion)}
                          className="text-xs text-[#F56304] hover:underline"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          <DialogFooter className="pt-4 border-t">
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
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update the details for this location</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
        
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
           

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude *</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  value={locationForm.latitude}
                  onChange={(e) => setLocationForm({ ...locationForm, latitude: parseFloat(e.target.value) })}
                  placeholder="e.g., 33.9437"
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude *</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  value={locationForm.longitude}
                  onChange={(e) => setLocationForm({ ...locationForm, longitude: parseFloat(e.target.value) })}
                  placeholder="e.g., -84.51763"
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

          <DialogFooter className="pt-4 border-t">
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
    if (!iso) return '';
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

function TierBadgeInline({ tier }: { tier?: Tier }) {
  if (!tier) return <Badge variant="outline">Tier: —</Badge>;
  const { Icon, label, color } = TIER_META[tier];
  return (
    <Badge variant="outline" className="gap-1 pr-2 pl-1">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="font-medium">{label}</span>
    </Badge>
  );
}

// Round now up to the next minute and return as <input type="datetime-local"> value
function nowLocalInputValue() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Ensure local input string is not in the past; if it is, snap to next minute
function clampToFutureLocal(localValue: string) {
  if (!localValue) return nowLocalInputValue();
  const chosen = new Date(localValue); // local time
  const now = new Date();
  if (chosen.getTime() <= now.getTime()) {
    const next = new Date();
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = next.getFullYear();
    const mm = pad(next.getMonth() + 1);
    const dd = pad(next.getDate());
    const hh = pad(next.getHours());
    const mi = pad(next.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }
  return localValue;
}