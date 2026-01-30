// src/pages/rate/CDWPage.tsx
// CDW (Collision Damage Waiver) settings page - matches design exactly

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import { useAppSelector } from '@/store';
import { useGetLocationCDWSettings, useUpdateLocationCDWSettings, validateCDWPercentage } from '@/hooks/useCDWApi';
import { useFetchData } from '@/hooks/useOperatorCarClass';
import type { UpdateLocationCDWFullPayload } from '@/types/cdw';

interface CompanyCarClass {
  id: string;
  carClass: {
    id: string;
    slug: string;
    name: string;
  };
  make: string | null;
  model: string | null;
}

export default function CDWPage() {
  const { locationId = '' } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((s) => s.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(companyId && locationId);

  // Fetch location CDW settings
  const {
    data: cdwData,
    isLoading: cdwLoading,
    isError: cdwError,
    refetch: refetchCDW,
  } = useGetLocationCDWSettings(locationId);

  // Fetch company car classes for this location
  const {
    data: carClassesData,
    isLoading: carClassesLoading,
  } = useFetchData<CompanyCarClass[]>(
    canOperate ? `company-car-class/${companyId}/${locationId}` : '',
    ['company-car-class', companyId, locationId],
    { enabled: canOperate }
  );

  // Update mutation
  const updateCDW = useUpdateLocationCDWSettings(locationId);

  // Form state
  const [cdwEnabled, setCdwEnabled] = useState(false);
  const [scope, setScope] = useState<'WHOLE_LOCATION' | 'PER_CAR_CLASS'>('WHOLE_LOCATION');
  const [wholeLocationPercentage, setWholeLocationPercentage] = useState('0');
  const [carClassPercentages, setCarClassPercentages] = useState<Array<{ id: string; slug: string; name: string; percentage: string }>>([]);
  const [revenueMethod, setRevenueMethod] = useState<'PART_OF_RENTAL' | 'SEPARATE'>('PART_OF_RENTAL');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxType, setTaxType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [taxValue, setTaxValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Admin CDW settings
  const adminCDWEnabled = cdwData?.adminCdwEnabled ?? true;
  const adminMinPercentage = cdwData?.adminCdwMinPercentage ?? '0';
  const adminMaxPercentage = cdwData?.adminCdwMaxPercentage ?? '100';
  const cdwTaxAllowed = cdwData?.cdwTaxOnCdwAllowed ?? true;

  // Car classes list
  const carClasses = useMemo(() => {
    if (!Array.isArray(carClassesData)) return [];
    return carClassesData.map((cc) => ({
      id: cc.id,
      name: cc.carClass?.name || cc.carClass?.slug || 'Unknown',
      slug: cc.carClass?.slug?.toUpperCase() || 'CAR',
      make: cc.make,
      model: cc.model,
    }));
  }, [carClassesData]);

  // Load data from API
  useEffect(() => {
    if (!cdwData) return;

    setCdwEnabled(cdwData.cdwEnabled ?? false);
    setScope(cdwData.scope || 'WHOLE_LOCATION');
    setWholeLocationPercentage(cdwData.cdwPercentage || '0');
    
    // Map cdwOption to revenueMethod (API returns cdwOption: "PART_OF_RENTAL" | "SEPARATE")
    const option = cdwData.cdwOption || cdwData.revenueCalculationMethod || 'PART_OF_RENTAL';
    setRevenueMethod(option as 'PART_OF_RENTAL' | 'SEPARATE');
    
    // Tax settings
    setTaxEnabled(cdwData.taxOnCdwEnabled ?? cdwData.cdwTaxApplicable ?? false);
    setTaxType(cdwData.cdwTaxType || 'PERCENTAGE');
    setTaxValue(cdwData.cdwTaxValue || '');

    // Load per-car-class percentages if applicable
    if (cdwData.scope === 'PER_CAR_CLASS' && cdwData.carClassPercentages) {
      const percentages = cdwData.carClassPercentages.map((ccp: { companyCarClassId: string; cdwPercentage: number }) => {
        const carClass = carClasses.find((cc) => cc.id === ccp.companyCarClassId);
        return {
          id: ccp.companyCarClassId,
          slug: carClass?.slug || 'CAR',
          name: carClass?.name || 'Unknown',
          percentage: String(ccp.cdwPercentage),
        };
      });
      setCarClassPercentages(percentages);
    }

    setHasChanges(false);
  }, [cdwData, carClasses]);

  // Sync car class percentages when scope is PER_CAR_CLASS (ensure all car classes have an entry)
  useEffect(() => {
    if (scope === 'PER_CAR_CLASS' && carClasses.length > 0) {
      setCarClassPercentages((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        return carClasses.map((cc) => {
          const existing = byId.get(cc.id);
          return existing ?? { id: cc.id, slug: cc.slug, name: cc.name, percentage: wholeLocationPercentage || '0' };
        });
      });
    }
  }, [scope, carClasses, wholeLocationPercentage]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [cdwEnabled, scope, wholeLocationPercentage, carClassPercentages, revenueMethod, taxEnabled, taxType, taxValue]);

  // Auto-enable tax when SEPARATE revenue method is selected
  useEffect(() => {
    if (revenueMethod === 'SEPARATE' && cdwTaxAllowed) {
      setTaxEnabled(true);
    } else if (revenueMethod === 'PART_OF_RENTAL') {
      setTaxEnabled(false);
    }
  }, [revenueMethod, cdwTaxAllowed]);

  // Validation (pass overrideEnabled when validating for toggle before state updates)
  const validateForm = (overrideEnabled?: boolean): { valid: boolean; message?: string } => {
    const enabled = overrideEnabled ?? cdwEnabled;
    if (!enabled) return { valid: true };

    if (scope === 'WHOLE_LOCATION') {
      const pct = parseFloat(wholeLocationPercentage);
      if (isNaN(pct)) {
        return { valid: false, message: 'Please enter a valid CDW percentage' };
      }
      const validation = validateCDWPercentage(pct, adminMinPercentage, adminMaxPercentage);
      if (!validation.valid) return validation;
    }

    if (scope === 'PER_CAR_CLASS') {
      for (const cc of carClassPercentages) {
        const pct = parseFloat(cc.percentage);
        if (isNaN(pct)) {
          return { valid: false, message: `Please enter a valid percentage for ${cc.name}` };
        }
        const validation = validateCDWPercentage(pct, adminMinPercentage, adminMaxPercentage);
        if (!validation.valid) {
          return { valid: false, message: `${cc.name}: ${validation.message}` };
        }
      }
    }

    if (taxEnabled && taxValue.trim() === '') {
      return { valid: false, message: 'Please enter a tax value' };
    }

    return { valid: true };
  };

  // Build payload for API
  const buildPayload = (enabled: boolean): UpdateLocationCDWFullPayload => {
    const payload: UpdateLocationCDWFullPayload = { cdwEnabled: enabled };
    if (!enabled) return payload;

    payload.scope = scope;
    payload.revenueCalculationMethod = revenueMethod;

    if (scope === 'WHOLE_LOCATION') {
      payload.wholeLocationPercentage = parseFloat(wholeLocationPercentage) || 0;
    } else {
      payload.carClassPercentages = carClassPercentages.map((cc) => ({
        companyCarClassId: cc.id,
        cdwPercentage: parseFloat(cc.percentage) || 0,
      }));
    }

    if (revenueMethod === 'SEPARATE' && taxEnabled) {
      payload.taxOnCdwEnabled = true;
      payload.taxOnCdwType = taxType;
      payload.taxOnCdwValue = parseFloat(taxValue) || 0;
    } else {
      payload.taxOnCdwEnabled = false;
    }
    return payload;
  };

  // Handle CDW enable/disable toggle - calls API immediately
  const handleCdwToggleChange = async (checked: boolean) => {
    const prevValue = cdwEnabled;

    if (checked) {
      const validation = validateForm(true);
      if (!validation.valid) {
        setCdwEnabled(true); // Show form so user can configure
        toast.info('Configure CDW settings below and click Save to enable');
        return;
      }
    }

    setCdwEnabled(checked);
    const payload: UpdateLocationCDWFullPayload = checked ? buildPayload(true) : { cdwEnabled: false };

    try {
      await updateCDW.mutateAsync(payload);
      toast.success(checked ? 'CDW enabled successfully' : 'CDW disabled successfully');
      setHasChanges(false);
      refetchCDW();
    } catch (error: any) {
      setCdwEnabled(prevValue);
      if (error?.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
        return;
      }
      const errorMsg = error?.response?.data?.message || 'Failed to update CDW status';
      toast.error(errorMsg);
      console.error('CDW toggle error:', error);
    }
  };

  // Save handler
  const handleSave = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const payload = buildPayload(cdwEnabled);

    try {
      await updateCDW.mutateAsync(payload);
      toast.success('CDW settings saved successfully');
      setHasChanges(false);
      refetchCDW();
    } catch (error: any) {
      if (error?.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
        return;
      }
      const errorMsg = error?.response?.data?.message || 'Failed to save CDW settings';
      toast.error(errorMsg);
      console.error('Save CDW settings error:', error);
    }
  };

  // Cancel handler - reset to API data
  const handleCancel = () => {
    if (cdwData) {
      setCdwEnabled(cdwData.cdwEnabled ?? false);
      setScope(cdwData.scope || 'WHOLE_LOCATION');
      setWholeLocationPercentage(cdwData.cdwPercentage || '0');
      const option = cdwData.cdwOption || cdwData.revenueCalculationMethod || 'PART_OF_RENTAL';
      setRevenueMethod(option as 'PART_OF_RENTAL' | 'SEPARATE');
      setTaxEnabled(cdwData.taxOnCdwEnabled ?? cdwData.cdwTaxApplicable ?? false);
      setTaxType(cdwData.cdwTaxType || 'PERCENTAGE');
      setTaxValue(cdwData.cdwTaxValue || '');
      setHasChanges(false);
      toast.info('Changes discarded');
    }
  };

  // Loading states
  if (!canOperate) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Company and Location required to manage CDW settings.</p>
      </div>
    );
  }

  if (cdwLoading || carClassesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
      </div>
    );
  }

  if (cdwError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load CDW settings.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchCDW()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main CDW Toggle Card */}
      <Card className="rounded-xl border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Enable Collision Damage Waiver</h2>
              <p className="text-sm text-gray-500 mt-0.5">Add CDW protection to your rental services</p>
            </div>
            <Switch
              checked={cdwEnabled}
              onCheckedChange={handleCdwToggleChange}
              disabled={!adminCDWEnabled || updateCDW.isPending}
              className="data-[state=checked]:bg-[#F56304]"
            />
          </div>
        </CardContent>
      </Card>

      {cdwEnabled && (
        <>
          {/* Admin CDW Range - show allowed percentage range */}
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-800">
              <strong>Allowed CDW range:</strong> {adminMinPercentage}% – {adminMaxPercentage}%
              <span className="text-blue-600 ml-1">(Enter values within this range only)</span>
            </span>
          </div>

          {/* Apply CDW To Card */}
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Apply CDW To</h3>
              
              {/* Scope Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setScope('WHOLE_LOCATION')}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    scope === 'WHOLE_LOCATION'
                      ? 'border-[#F56304] bg-orange-50 text-[#F56304]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    scope === 'WHOLE_LOCATION' ? 'border-[#F56304]' : 'border-gray-300'
                  }`}>
                    {scope === 'WHOLE_LOCATION' && <div className="w-2 h-2 rounded-full bg-[#F56304]" />}
                  </div>
                  For Whole Location
                </button>
                <button
                  type="button"
                  onClick={() => setScope('PER_CAR_CLASS')}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    scope === 'PER_CAR_CLASS'
                      ? 'border-[#F56304] bg-orange-50 text-[#F56304]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    scope === 'PER_CAR_CLASS' ? 'border-[#F56304]' : 'border-gray-300'
                  }`}>
                    {scope === 'PER_CAR_CLASS' && <div className="w-2 h-2 rounded-full bg-[#F56304]" />}
                  </div>
                  For Each Class
                </button>
              </div>

              {/* CDW Percentage Section */}
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  {scope === 'WHOLE_LOCATION' ? 'Set CDW For Whole Location' : 'Set CDW Percentage by Class'}
                </h4>
                <Info className="h-4 w-4 text-gray-400" />
              </div>

              {scope === 'WHOLE_LOCATION' ? (
                <Card className="rounded-lg border border-gray-200 bg-white">
                  <CardContent className="p-4">
                    <Label className="text-xs font-medium text-[#F56304] uppercase tracking-wide">
                      Whole Location CDW ({adminMinPercentage}% – {adminMaxPercentage}%)
                    </Label>
                    <div className="mt-2 flex items-center">
                      <Input
                        type="number"
                        min={parseFloat(adminMinPercentage)}
                        max={parseFloat(adminMaxPercentage)}
                        step="0.1"
                        value={wholeLocationPercentage}
                        onChange={(e) => setWholeLocationPercentage(e.target.value)}
                        placeholder={`${adminMinPercentage} – ${adminMaxPercentage}`}
                        className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                      />
                      <span className="ml-2 text-sm text-gray-500">%</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {carClassPercentages.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-2">No car classes available for this location</p>
                  ) : (
                    carClassPercentages.map((cc, index) => (
                      <Card key={cc.id} className="rounded-lg border border-gray-200 bg-white">
                        <CardContent className="p-4">
                          <Label className="text-xs font-medium uppercase tracking-wide">
                            <span className="text-[#F56304]">{cc.slug}</span>
                            <span className="text-gray-400 ml-2">{cc.name}</span>
                            <span className="text-gray-400 ml-1">({adminMinPercentage}% – {adminMaxPercentage}%)</span>
                          </Label>
                          <div className="mt-2 flex items-center">
                            <Input
                              type="number"
                              min={parseFloat(adminMinPercentage)}
                              max={parseFloat(adminMaxPercentage)}
                              step="0.1"
                              value={cc.percentage}
                              onChange={(e) => {
                                const updated = [...carClassPercentages];
                                updated[index].percentage = e.target.value;
                                setCarClassPercentages(updated);
                              }}
                              placeholder={`${adminMinPercentage} – ${adminMaxPercentage}`}
                              className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                            />
                            <span className="ml-2 text-sm text-gray-500">%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Calculation Method Card */}
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900">Revenue Calculation Method</h3>
              <p className="text-sm text-gray-500 mt-0.5 mb-4">Choose how CDW amount should be calculated in your revenue</p>

              <div className="space-y-4">
                {/* Part of Rental */}
                <button
                  type="button"
                  onClick={() => setRevenueMethod('PART_OF_RENTAL')}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                    revenueMethod === 'PART_OF_RENTAL'
                      ? 'border-[#F56304] bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      revenueMethod === 'PART_OF_RENTAL' ? 'border-[#F56304]' : 'border-gray-300'
                    }`}>
                      {revenueMethod === 'PART_OF_RENTAL' && <div className="w-2.5 h-2.5 rounded-full bg-[#F56304]" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Consider CDW as Part of Rental Revenue</p>
                      <p className="text-sm text-gray-500 mt-0.5">CDW amount will be included in the total rental revenue calculation</p>
                      <div className="mt-3 rounded-lg bg-gray-100 p-3">
                        <p className="text-xs text-gray-500">Example:</p>
                        <p className="text-sm text-gray-700">
                          Rental: $100 + CDW (15%): $15 = <span className="text-green-600 font-medium">Total Revenue: $115</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Separate */}
                <button
                  type="button"
                  onClick={() => setRevenueMethod('SEPARATE')}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                    revenueMethod === 'SEPARATE'
                      ? 'border-[#F56304] bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      revenueMethod === 'SEPARATE' ? 'border-[#F56304]' : 'border-gray-300'
                    }`}>
                      {revenueMethod === 'SEPARATE' && <div className="w-2.5 h-2.5 rounded-full bg-[#F56304]" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Consider CDW Separate from Rental Revenue</p>
                      <p className="text-sm text-gray-500 mt-0.5">CDW amount will be tracked separately from rental revenue</p>
                      <div className="mt-3 rounded-lg bg-gray-100 p-3">
                        <p className="text-xs text-gray-500">Example:</p>
                        <p className="text-sm">
                          <span className="text-[#F56304] font-medium">Rental Revenue: $100</span>
                          <span className="text-gray-400 mx-2">|</span>
                          <span className="text-blue-600 font-medium">CDW Revenue: $15</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Tax on CDW Card - Only show when SEPARATE revenue method is selected */}
          {cdwTaxAllowed && revenueMethod === 'SEPARATE' && (
            <Card className="rounded-xl border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Tax on CDW</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Enable if tax is applicable on CDW amount</p>
                  </div>
                  <Switch
                    checked={taxEnabled}
                    onCheckedChange={setTaxEnabled}
                    className="data-[state=checked]:bg-[#F56304]"
                  />
                </div>

                {taxEnabled && (
                  <>
                    {/* Tax Type Toggle */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setTaxType('PERCENTAGE')}
                        className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          taxType === 'PERCENTAGE'
                            ? 'border-[#F56304] bg-[#F56304] text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxType('FIXED')}
                        className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          taxType === 'FIXED'
                            ? 'border-[#F56304] bg-[#F56304] text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Fixed Amount
                      </button>
                    </div>

                    {/* Tax Value Input */}
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min={0}
                        step={taxType === 'PERCENTAGE' ? '0.1' : '0.01'}
                        value={taxValue}
                        onChange={(e) => setTaxValue(e.target.value)}
                        placeholder={taxType === 'PERCENTAGE' ? 'Enter tax percentage' : 'Enter fixed tax amount'}
                        className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                      />
                      <span className="ml-2 text-sm text-gray-500">{taxType === 'PERCENTAGE' ? '%' : '$'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateCDW.isPending}
              className="rounded-lg border-gray-300 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateCDW.isPending}
              className="rounded-lg bg-[#F56304] hover:bg-[#e05503] text-white px-6"
            >
              {updateCDW.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save CDW Settings'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
