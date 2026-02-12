'use client';

import * as React from 'react';
import { useParams } from '@/hooks/useNextNavigation';
import { useAppSelector } from '@/store';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap,
  FileStack,
  Car,
  Clock,
  Calendar,
  Building2,
  Sparkles,
  Settings,
  ChevronRight,
  Crown,
  Save,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useGetLocationBiddingConfig,
  useUpdateLocationBiddingConfig,
} from '@/hooks/useBiddingApi';

const COLOR_CLASSES = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'bg-blue-500',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'bg-purple-500',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'bg-green-500',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'bg-[#F56304]',
  },
} as const;

type ColorKey = keyof typeof COLOR_CLASSES;

const COLOR_KEYS: ColorKey[] = ['blue', 'purple', 'orange', 'purple', 'green'];

type ScopeType = 'whole' | 'each';

/** Convert UI discount % (0-50) to backend bidding % (50-100) */
function discountToBiddingPct(discount: number): number {
  return Math.round(100 - discount);
}

/** Convert backend bidding % (50-100) to UI discount % (0-50) */
function biddingPctToDiscount(pct: number | null | undefined): number {
  if (pct == null) return 0;
  return Math.max(0, Math.min(50, 100 - pct));
}

export default function BidManagementPage() {
  const { locationId = '' } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((s) => s.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(companyId && locationId);

  const {
    data: biddingData,
    isLoading: biddingLoading,
    isError: biddingError,
    refetch: refetchBidding,
  } = useGetLocationBiddingConfig(locationId);

  const updateBidding = useUpdateLocationBiddingConfig(locationId);

  const [bidEnabled, setBidEnabled] = React.useState(false);
  const [scope, setScope] = React.useState<ScopeType>('whole');
  const [selectedCarClass, setSelectedCarClass] = React.useState<string | null>(
    null,
  );

  const [dailyRate, setDailyRate] = React.useState(0);
  const [dailyEnabled, setDailyEnabled] = React.useState(false);
  const [weeklyRate, setWeeklyRate] = React.useState(0);
  const [weeklyEnabled, setWeeklyEnabled] = React.useState(false);
  const [monthlyRate, setMonthlyRate] = React.useState(0);
  const [monthlyEnabled, setMonthlyEnabled] = React.useState(false);

  const [carClassBiddings, setCarClassBiddings] = React.useState<
    Array<{
      companyCarClassId: string;
      name: string;
      dailyRate: number;
      dailyEnabled: boolean;
      weeklyRate: number;
      weeklyEnabled: boolean;
      monthlyRate: number;
      monthlyEnabled: boolean;
    }>
  >([]);

  const carClasses = React.useMemo(
    () => biddingData?.carClassesAtLocation ?? [],
    [biddingData],
  );

  React.useEffect(() => {
    if (!biddingData) return;

    setBidEnabled(biddingData.biddingEnabled ?? false);
    setScope(
      biddingData.biddingMode === 'per_car_class' ? 'each' : 'whole',
    );

    setDailyRate(biddingPctToDiscount(biddingData.biddingDailyPct));
    setDailyEnabled(biddingData.biddingDailyPct != null);
    setWeeklyRate(biddingPctToDiscount(biddingData.biddingWeeklyPct));
    setWeeklyEnabled(biddingData.biddingWeeklyPct != null);
    setMonthlyRate(biddingPctToDiscount(biddingData.biddingMonthlyPct));
    setMonthlyEnabled(biddingData.biddingMonthlyPct != null);

    if (biddingData.biddingMode === 'per_car_class' && biddingData.carClassBiddings?.length) {
      const mapped = biddingData.carClassesAtLocation.map((cc) => {
        const b = biddingData.carClassBiddings?.find(
          (b) => b.companyCarClassId === cc.id,
        );
        return {
          companyCarClassId: cc.id,
          name: cc.name,
          dailyRate: biddingPctToDiscount(b?.biddingDailyPct),
          dailyEnabled: b?.biddingDailyPct != null,
          weeklyRate: biddingPctToDiscount(b?.biddingWeeklyPct),
          weeklyEnabled: b?.biddingWeeklyPct != null,
          monthlyRate: biddingPctToDiscount(b?.biddingMonthlyPct),
          monthlyEnabled: b?.biddingMonthlyPct != null,
        };
      });
      setCarClassBiddings(mapped);
    } else if (carClasses.length > 0) {
      setCarClassBiddings(
        carClasses.map((cc) => ({
          companyCarClassId: cc.id,
          name: cc.name,
          dailyRate: 0,
          dailyEnabled: false,
          weeklyRate: 0,
          weeklyEnabled: false,
          monthlyRate: 0,
          monthlyEnabled: false,
        })),
      );
    }

    if (carClasses.length > 0 && !selectedCarClass) {
      setSelectedCarClass(carClasses[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync from API when biddingData/carClasses change, not when user selects a car class
  }, [biddingData, carClasses.length]);

  React.useEffect(() => {
    if (scope === 'each' && carClasses.length > 0 && carClassBiddings.length === 0) {
      setCarClassBiddings(
        carClasses.map((cc) => ({
          companyCarClassId: cc.id,
          name: cc.name,
          dailyRate,
          dailyEnabled,
          weeklyRate,
          weeklyEnabled,
          monthlyRate,
          monthlyEnabled,
        })),
      );
    }
  }, [scope, carClasses, dailyRate, dailyEnabled, weeklyRate, weeklyEnabled, monthlyRate, monthlyEnabled, carClassBiddings.length]);

  const selectedBidding = React.useMemo(
    () => carClassBiddings.find((b) => b.companyCarClassId === selectedCarClass),
    [carClassBiddings, selectedCarClass],
  );

  const displayDaily = scope === 'each' ? selectedBidding?.dailyRate ?? dailyRate : dailyRate;
  const displayWeekly = scope === 'each' ? selectedBidding?.weeklyRate ?? weeklyRate : weeklyRate;
  const displayMonthly = scope === 'each' ? selectedBidding?.monthlyRate ?? monthlyRate : monthlyRate;
  const displayDailyEnabled = scope === 'each' ? selectedBidding?.dailyEnabled ?? dailyEnabled : dailyEnabled;
  const displayWeeklyEnabled = scope === 'each' ? selectedBidding?.weeklyEnabled ?? weeklyEnabled : weeklyEnabled;
  const displayMonthlyEnabled = scope === 'each' ? selectedBidding?.monthlyEnabled ?? monthlyEnabled : monthlyEnabled;

  const setDisplayDaily = (v: number) => {
    if (scope === 'each' && selectedCarClass) {
      setCarClassBiddings((prev) =>
        prev.map((b) =>
          b.companyCarClassId === selectedCarClass ? { ...b, dailyRate: v } : b,
        ),
      );
    } else setDailyRate(v);
  };
  const setDisplayWeekly = (v: number) => {
    if (scope === 'each' && selectedCarClass) {
      setCarClassBiddings((prev) =>
        prev.map((b) =>
          b.companyCarClassId === selectedCarClass ? { ...b, weeklyRate: v } : b,
        ),
      );
    } else setWeeklyRate(v);
  };
  const setDisplayMonthly = (v: number) => {
    if (scope === 'each' && selectedCarClass) {
      setCarClassBiddings((prev) =>
        prev.map((b) =>
          b.companyCarClassId === selectedCarClass ? { ...b, monthlyRate: v } : b,
        ),
      );
    } else setMonthlyRate(v);
  };
  const setDisplayDailyEnabled = (v: boolean) => {
    if (scope === 'each' && selectedCarClass) {
      setCarClassBiddings((prev) =>
        prev.map((b) =>
          b.companyCarClassId === selectedCarClass ? { ...b, dailyEnabled: v } : b,
        ),
      );
    } else setDailyEnabled(v);
  };
  const setDisplayWeeklyEnabled = (v: boolean) => {
    if (scope === 'each' && selectedCarClass) {
      setCarClassBiddings((prev) =>
        prev.map((b) =>
          b.companyCarClassId === selectedCarClass ? { ...b, weeklyEnabled: v } : b,
        ),
      );
    } else setWeeklyEnabled(v);
  };
  const setDisplayMonthlyEnabled = (v: boolean) => {
    if (scope === 'each' && selectedCarClass) {
      setCarClassBiddings((prev) =>
        prev.map((b) =>
          b.companyCarClassId === selectedCarClass ? { ...b, monthlyEnabled: v } : b,
        ),
      );
    } else setMonthlyEnabled(v);
  };

  const buildPayload = () => {
    if (!bidEnabled) {
      return { biddingEnabled: false };
    }

    if (scope === 'whole') {
      const daily = dailyEnabled ? discountToBiddingPct(dailyRate) : null;
      const weekly = weeklyEnabled ? discountToBiddingPct(weeklyRate) : null;
      const monthly = monthlyEnabled ? discountToBiddingPct(monthlyRate) : null;
      if (daily == null && weekly == null && monthly == null) {
        return null;
      }
      return {
        biddingEnabled: true,
        biddingMode: 'global' as const,
        globalPercentages: {
          biddingDailyPct: daily ?? undefined,
          biddingWeeklyPct: weekly ?? undefined,
          biddingMonthlyPct: monthly ?? undefined,
        },
      };
    }

    const items = carClassBiddings.map((b) => {
      const daily = b.dailyEnabled ? discountToBiddingPct(b.dailyRate) : null;
      const weekly = b.weeklyEnabled ? discountToBiddingPct(b.weeklyRate) : null;
      const monthly = b.monthlyEnabled ? discountToBiddingPct(b.monthlyRate) : null;
      if (daily == null && weekly == null && monthly == null) return null;
      return {
        companyCarClassId: b.companyCarClassId,
        biddingDailyPct: daily ?? undefined,
        biddingWeeklyPct: weekly ?? undefined,
        biddingMonthlyPct: monthly ?? undefined,
      };
    }).filter(Boolean) as { companyCarClassId: string; biddingDailyPct?: number; biddingWeeklyPct?: number; biddingMonthlyPct?: number }[];

    if (items.length === 0) return null;

    return {
      biddingEnabled: true,
      biddingMode: 'per_car_class' as const,
      carClassBiddings: items,
    };
  };

  const handleSave = async () => {
    if (!canOperate) {
      toast.error('Company and location required');
      return;
    }

    const payload = buildPayload();
    if (payload === null) {
      toast.error('At least one of Daily, Weekly, or Monthly must be enabled with a value');
      return;
    }

    try {
      await updateBidding.mutateAsync(payload);
      toast.success('Bid settings saved successfully');
      refetchBidding();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to save bid settings';
      toast.error(msg);
    }
  };

  const biddingAllowedByAdmin = biddingData?.biddingAllowedByAdmin ?? false;
  const isSaving = updateBidding.isPending;
  const basePrice = 100;

  // Bidding % (50-100) for Impact Analysis - "min X% of quote"
  const impactDailyPct = displayDailyEnabled ? discountToBiddingPct(displayDaily) : null;
  const impactWeeklyPct = displayWeeklyEnabled ? discountToBiddingPct(displayWeekly) : null;
  const impactMonthlyPct = displayMonthlyEnabled ? discountToBiddingPct(displayMonthly) : null;

  if (!canOperate) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Company and location required to manage bid settings.
        </p>
      </div>
    );
  }

  if (biddingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
      </div>
    );
  }

  if (biddingError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load bid settings.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchBidding()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex min-h-[60vh] gap-6">
        <div className="flex-1 space-y-6 max-w-7xl min-w-0">
          <Card className="rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F56304]">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Bid My Rental
                    </h2>
                    <p className="text-sm text-gray-500">
                      Dynamic pricing with auto-approval
                    </p>
                  </div>
                </div>
                <Switch
                  checked={bidEnabled}
                  onCheckedChange={setBidEnabled}
                  disabled={!biddingAllowedByAdmin}
                  className="data-[state=checked]:bg-[#F56304]"
                />
              </div>
              {!biddingAllowedByAdmin && (
                <p className="mt-2 text-sm text-amber-600">
                  Bidding is not allowed for your company. Admin must enable it first.
                </p>
              )}
            </CardContent>
          </Card>

          {bidEnabled && biddingAllowedByAdmin && (
            <>
              <Card className="rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Application Scope
                    </CardTitle>
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Choose your strategy
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScopeOption
                      scope="whole"
                      currentScope={scope}
                      onSelect={() => setScope('whole')}
                      icon={FileStack}
                      title="Whole Location"
                      desc="Apply unified rates across all vehicle classes"
                      cta="Quick setup"
                    />
                    <ScopeOption
                      scope="each"
                      currentScope={scope}
                      onSelect={() => setScope('each')}
                      icon={Car}
                      title="Each Car Class"
                      desc="Customize rates individually per vehicle class"
                      cta="Advanced control"
                    />
                  </div>
                </CardContent>
              </Card>

              {scope === 'each' && carClasses.length > 0 && (
                <Card className="rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Select Car Class
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {carClasses.map((cc, idx) => {
                        const isSelected = selectedCarClass === cc.id;
                        const colors = COLOR_CLASSES[COLOR_KEYS[idx % COLOR_KEYS.length]];
                        const nameLower = (cc.name || '').toLowerCase();
                        const Icon = nameLower.includes('luxury') ? Crown : Car;
                        return (
                          <button
                            key={cc.id}
                            type="button"
                            onClick={() => setSelectedCarClass(cc.id)}
                            className={cn(
                              'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium',
                              isSelected
                                ? `${colors.border} ${colors.bg} ${colors.text}`
                                : 'border-gray-200 hover:border-gray-300 text-gray-700',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg',
                                isSelected ? colors.icon : 'bg-gray-200',
                              )}
                            >
                              <Icon
                                className={cn(
                                  'h-4 w-4',
                                  isSelected ? 'text-white' : 'text-gray-500',
                                )}
                              />
                            </div>
                            {cc.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <Settings className="h-4 w-4 text-[#F56304]" />
                      Configure rates for{' '}
                      <span className="font-semibold text-gray-900">
                        {carClasses.find((c) => c.id === selectedCarClass)?.name ?? 'selected'}
                      </span>{' '}
                      class below
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Acceptance Rates
                    </CardTitle>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Auto-Approve Enabled
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RateSliderRow
                    label="Daily Rate"
                    subtitle="Rentals 1-6 days"
                    value={displayDaily}
                    onValueChange={setDisplayDaily}
                    enabled={displayDailyEnabled}
                    onEnabledChange={setDisplayDailyEnabled}
                    color="blue"
                    icon={Clock}
                  />
                  <RateSliderRow
                    label="Weekly Rate"
                    subtitle="Rentals 7-21 days"
                    value={displayWeekly}
                    onValueChange={setDisplayWeekly}
                    enabled={displayWeeklyEnabled}
                    onEnabledChange={setDisplayWeeklyEnabled}
                    color="purple"
                    icon={Calendar}
                  />
                  <RateSliderRow
                    label="Monthly Rate"
                    subtitle="Rentals 22+ days"
                    value={displayMonthly}
                    onValueChange={setDisplayMonthly}
                    enabled={displayMonthlyEnabled}
                    onEnabledChange={setDisplayMonthlyEnabled}
                    color="green"
                    icon={Building2}
                  />
                  <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-800">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-700 font-medium">
                      i
                    </span>
                    <p>
                      Drag sliders for instant adjustments. Bidding % must be 50–100 (min price as % of quote).
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      size="lg"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-[#F56304] hover:bg-[#E55500] text-white font-semibold px-6 shadow-md hover:shadow-lg transition-all"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Bid Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {biddingAllowedByAdmin && (
        <div className="w-100 shrink-0 space-y-6">
          <Card className="rounded-xl border-0 bg-gray-900 text-white shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F56304]" />
                <CardTitle className="text-base font-semibold">
                  Impact Analysis
                </CardTitle>
              </div>
              <p className="text-sm text-gray-400">Live calculations</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <ImpactRow
                  label="Daily (1-6 days)"
                  discountPct={displayDaily}
                  biddingPct={impactDailyPct}
                  enabled={displayDailyEnabled}
                />
                <ImpactRow
                  label="Weekly (7-28 days)"
                  discountPct={displayWeekly}
                  biddingPct={impactWeeklyPct}
                  enabled={displayWeeklyEnabled}
                />
                <ImpactRow
                  label="Monthly (29+ days)"
                  discountPct={displayMonthly}
                  biddingPct={impactMonthlyPct}
                  enabled={displayMonthlyEnabled}
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-300">Live & Active</span>
                </div>
                <span className="text-sm text-gray-400">Base: ${basePrice}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm bg-amber-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#F56304]" />
                <CardTitle className="text-base font-semibold text-gray-900">
                  Pro Tips
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#F56304] mt-0.5">✓</span>
                  Use <strong>Smart Templates</strong> for instant setup
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F56304] mt-0.5">✓</span>
                  Drag <strong>sliders</strong> for smooth, visual control
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F56304] mt-0.5">✓</span>
                  Enable <strong>Comparison View</strong> to see trends
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}

function ScopeOption({
  scope,
  currentScope,
  onSelect,
  icon: Icon,
  title,
  desc,
  cta,
}: {
  scope: ScopeType;
  currentScope: ScopeType;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  desc: string;
  cta: string;
}) {
  const isSelected = currentScope === scope;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-start p-5 rounded-xl border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F56304] focus-visible:ring-offset-2',
        isSelected
          ? 'border-[#F56304] bg-orange-50/30 shadow-sm ring-1 ring-[#F56304]/20'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 bg-white',
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 rounded-full bg-[#F56304] p-1">
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-lg mb-3',
          isSelected ? 'bg-[#F56304]' : 'bg-gray-200',
        )}
      >
        <Icon
          className={cn('h-6 w-6', isSelected ? 'text-white' : 'text-gray-500')}
        />
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{desc}</p>
      <span
        className={cn(
          'text-sm font-medium flex items-center gap-1',
          isSelected ? 'text-[#F56304]' : 'text-gray-500',
        )}
      >
        {cta}
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function RateSliderRow({
  label,
  subtitle,
  value,
  onValueChange,
  enabled,
  onEnabledChange,
  color,
  icon: Icon,
}: {
  label: string;
  subtitle: string;
  value: number;
  onValueChange: (v: number) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  color: ColorKey;
  icon: React.ElementType;
}) {
  const colors = COLOR_CLASSES[color] ?? COLOR_CLASSES.blue;
  const sliderColorClass =
    color === 'blue'
      ? '[&_[data-orientation=horizontal]>span:first-child]:!bg-blue-500'
      : color === 'purple'
        ? '[&_[data-orientation=horizontal]>span:first-child]:!bg-purple-500'
        : '[&_[data-orientation=horizontal]>span:first-child]:!bg-green-500';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              colors.icon,
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900">{value}%</span>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            className={cn(
              'data-[state=checked]:bg-[#F56304]',
              !enabled && 'bg-gray-200',
            )}
          />
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v ?? 0)}
        max={50}
        step={1}
        className={cn('w-full', sliderColorClass)}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
      </div>
    </div>
  );
}

function ImpactRow({
  label,
  discountPct,
  biddingPct,
  enabled = true,
}: {
  label: string;
  discountPct: number;
  biddingPct: number | null;
  enabled?: boolean;
}) {
  const hasValue = enabled && (discountPct !== 0 || biddingPct != null);
  return (
    <div className="rounded-lg bg-gray-800/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            hasValue ? 'bg-purple-500/20 text-purple-200' : 'bg-gray-700/50 text-gray-400'
          }`}
        >
          {hasValue ? `${discountPct}% off` : '—'}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        Set: <span className="text-gray-300">{discountPct}% off</span>
        {biddingPct != null && (
          <>
            {' · '}
            Min: <span className="text-gray-300">{biddingPct}% of quote</span>
          </>
        )}
      </p>
    </div>
  );
}
