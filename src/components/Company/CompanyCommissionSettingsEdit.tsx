'use client';

// Commission Settings Edit page - form populated from API, mode toggle with warning modal

import { useParams, useNavigate } from '@/hooks/useNextNavigation';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCompany } from '@/hooks/useCompanyApi';
import {
  useGetCompanySettings as useGetCompanySettingsOld,
  useSetStatusCommissionSettings,
  useSetFixedCancellationAmounts,
  useSetEdgeCaseHandling,
} from '@/hooks/usePlansApi';
import {
  useGetCompanySettings,
  useUpdateCompanyCDWSettings,
  validateCDWRange,
} from '@/hooks/useCDWApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2,
  ArrowLeft,
  Check,
  Pencil,
  Settings,
  Percent,
  Clock,
  XCircle,
  Users,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type {
  StatusCommissionSetting,
  StatusCommissionSettingsPayload,
} from '@/types/company';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const COMMISSION_ORANGE = '#F56304';

function CompanyCommissionSettingsEditPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: companyRes,
    isLoading: companyLoading,
    error: companyError,
  } = useGetCompany(companyId || '');
  const { data: settingsResOld } = useGetCompanySettingsOld(companyId || '');
  const { data: settingsRes, isLoading: settingsLoading } =
    useGetCompanySettings(companyId || '');
  const setStatusSettings = useSetStatusCommissionSettings(companyId || '');
  const setFixedAmounts = useSetFixedCancellationAmounts(companyId || '');
  const setEdgeCase = useSetEdgeCaseHandling(companyId || '');
  const updateCDWSettings = useUpdateCompanyCDWSettings(companyId || '');

  const [modeChangeModalOpen, setModeChangeModalOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<'PERCENTAGE' | 'FIXED' | null>(
    null,
  );

  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED'>(
    'PERCENTAGE',
  );
  const [platformCommissionPct, setPlatformCommissionPct] = useState('10');
  const [platformCommissionFixed, setPlatformCommissionFixed] = useState('10');
  const [operatorFaultPct, setOperatorFaultPct] = useState('15');
  const [lateCancel, setLateCancel] = useState({
    penaltyPct: '30',
    yalaRideShare: '10',
    remainingToOperator: true,
  });
  const [noShow, setNoShow] = useState({
    penaltyPct: '25',
    yalaRideShare: '15',
    remainingToOperator: true,
  });
  const [customerFault, setCustomerFault] = useState({
    penaltyPct: '20',
    yalaRideShare: '8',
    remainingToOperator: true,
  });
  const [cdwEnabled, setCdwEnabled] = useState(false);
  const [cdwMin, setCdwMin] = useState('5');
  const [cdwMax, setCdwMax] = useState('20');
  const [cdwCommission, setCdwCommission] = useState('10');
  const [edgeCaseOWE, setEdgeCaseOWE] = useState(false);
  const [edgeCaseCAP, setEdgeCaseCAP] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load commission settings from old API
  useEffect(() => {
    if (!settingsResOld?.data?.settings) return;
    const s = settingsResOld.data.settings as any;
    const scs = s.statusCommissionSettings ?? {};
    const completedSetting = scs.COMPLETED as
      | StatusCommissionSetting
      | undefined;
    // Prefer COMPLETED.type (same source as view page)
    const type = (completedSetting?.type ||
      s.commissionType ||
      'PERCENTAGE') as 'PERCENTAGE' | 'FIXED';
    setCommissionType(type);
    // Use COMPLETED values when available, else fallback to column fields
    const rate =
      completedSetting?.percentageRate ??
      s.effectiveCommissionRate ??
      s.baseCommissionRate ??
      '10';
    const fixedAmt =
      completedSetting?.fixedAmount ?? s.fixedCommissionAmount ?? rate;
    setPlatformCommissionPct(String(rate));
    setPlatformCommissionFixed(
      typeof fixedAmt === 'number'
        ? String(fixedAmt)
        : String(fixedAmt ?? '10'),
    );
    const opFault = scs.OPERATOR_FAULT as StatusCommissionSetting | undefined;
    setOperatorFaultPct(String(opFault?.penaltyPercentage ?? 15));
    const late = scs.LATE_CANCEL as StatusCommissionSetting | undefined;
    setLateCancel({
      penaltyPct: String(late?.percentageRate ?? 30),
      yalaRideShare:
        late?.fixedAmount != null
          ? String(late.fixedAmount)
          : String(late?.splitPercentage ?? 10),
      remainingToOperator: true,
    });
    const noShowS = scs.NO_SHOW as StatusCommissionSetting | undefined;
    setNoShow({
      penaltyPct: String(noShowS?.percentageRate ?? 25),
      yalaRideShare:
        noShowS?.fixedAmount != null
          ? String(noShowS.fixedAmount)
          : String(noShowS?.splitPercentage ?? 15),
      remainingToOperator: true,
    });
    const cust = scs.CUSTOMER_FAULT as StatusCommissionSetting | undefined;
    setCustomerFault({
      penaltyPct: String(cust?.percentageRate ?? 20),
      yalaRideShare:
        cust?.fixedAmount != null
          ? String(cust.fixedAmount)
          : String(cust?.splitPercentage ?? 8),
      remainingToOperator: true,
    });
    setEdgeCaseOWE((s.edgeCaseHandling ?? 'CAP') === 'OWE');
    setEdgeCaseCAP((s.edgeCaseHandling ?? 'CAP') === 'CAP');
  }, [settingsResOld]);

  // Load CDW settings from new API
  useEffect(() => {
    // useFetchData already extracts data.data, so settingsRes is CompanySettingsResponse directly
    if (!settingsRes?.settings?.cdw) return;

    const cdw = settingsRes.settings.cdw;
    setCdwEnabled(cdw.cdwEnabled ?? false);
    setCdwMin(cdw.cdwMinPercentage ? String(cdw.cdwMinPercentage) : '5');
    setCdwMax(cdw.cdwMaxPercentage ? String(cdw.cdwMaxPercentage) : '20');
    setCdwCommission(
      cdw.cdwCommissionPercentage ? String(cdw.cdwCommissionPercentage) : '10',
    );
  }, [settingsRes]);

  if (companyLoading || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
      </div>
    );
  }

  if (companyError || !companyRes?.data?.company) {
    return (
      <div className="rounded-lg border border-destructive p-4 text-destructive">
        <p>Error loading company.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => navigate('/companies/list')}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const company = companyRes.data.company as any;
  const isFixedMode = commissionType === 'FIXED';

  const handleModeClick = (newMode: 'PERCENTAGE' | 'FIXED') => {
    if (newMode === commissionType) return;
    setPendingMode(newMode);
    setModeChangeModalOpen(true);
    console.log('Mode change requested:', newMode);
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      setCommissionType(pendingMode);
      setHasUnsavedChanges(true);

      // Clear all commission fields (data loss as per warning)
      setPlatformCommissionPct('');
      setPlatformCommissionFixed('');
      setOperatorFaultPct('');
      setLateCancel({
        penaltyPct: '',
        yalaRideShare: '',
        remainingToOperator: true,
      });
      setNoShow({
        penaltyPct: '',
        yalaRideShare: '',
        remainingToOperator: true,
      });
      setCustomerFault({
        penaltyPct: '',
        yalaRideShare: '',
        remainingToOperator: true,
      });
      setEdgeCaseOWE(false);
      setEdgeCaseCAP(true);

      toast.info(
        `Mode changed to ${pendingMode === 'FIXED' ? 'Fixed' : 'Percentage'}. Fill in the fields and click "Save Settings" to apply.`,
      );
      setPendingMode(null);
      setModeChangeModalOpen(false);
    }
  };

  // Client-side validation (matches backend: min 0.01, max 100)
  const validateCommissionForm = (): { valid: boolean; message: string } => {
    const MIN = 0.01;
    const MAX = 100;

    // COMPLETED
    if (isFixedMode) {
      const fixed = parseFloat(platformCommissionFixed);
      if (isNaN(fixed) || fixed < MIN) {
        return {
          valid: false,
          message: 'Platform Commission (Fixed) must be at least 0.01 USD',
        };
      }
      if (fixed > 9999.99) {
        return {
          valid: false,
          message: 'Platform Commission (Fixed) must not exceed 9999.99 USD',
        };
      }
    } else {
      const pct = parseFloat(platformCommissionPct);
      if (isNaN(pct) || pct < MIN || pct > MAX) {
        return {
          valid: false,
          message: 'Platform Commission (%) must be between 0.01 and 100',
        };
      }
    }

    // Operator Fault
    const opPct = parseFloat(operatorFaultPct);
    if (isNaN(opPct) || opPct < MIN || opPct > MAX) {
      return {
        valid: false,
        message: 'Operator Fault penalty (%) must be between 0.01 and 100',
      };
    }

    // Late Cancel, No Show, Customer Fault
    const penaltyFields = [
      {
        name: 'Late Cancel',
        penaltyPct: lateCancel.penaltyPct,
        share: lateCancel.yalaRideShare,
      },
      {
        name: 'No Show',
        penaltyPct: noShow.penaltyPct,
        share: noShow.yalaRideShare,
      },
      {
        name: 'Customer Fault',
        penaltyPct: customerFault.penaltyPct,
        share: customerFault.yalaRideShare,
      },
    ];
    for (const f of penaltyFields) {
      const penalty = parseFloat(f.penaltyPct);
      if (isNaN(penalty) || penalty < MIN || penalty > MAX) {
        return {
          valid: false,
          message: `${f.name}: Penalty rate must be between 0.01 and 100`,
        };
      }
      const share = parseFloat(f.share);
      if (isFixedMode) {
        if (isNaN(share) || share < MIN) {
          return {
            valid: false,
            message: `${f.name}: YalaRide share (USD) must be at least 0.01`,
          };
        }
      } else {
        if (isNaN(share) || share < 0 || share > MAX) {
          return {
            valid: false,
            message: `${f.name}: YalaRide share (%) must be between 0 and 100`,
          };
        }
      }
    }

    return { valid: true, message: '' };
  };

  const handleSave = async () => {
    // Validate commission settings
    const commissionValidation = validateCommissionForm();
    if (!commissionValidation.valid) {
      toast.error(commissionValidation.message);
      return;
    }

    // Validate CDW settings if enabled
    if (cdwEnabled) {
      const minNum = parseFloat(cdwMin);
      const maxNum = parseFloat(cdwMax);
      const commNum = parseFloat(cdwCommission);

      const rangeValidation = validateCDWRange(minNum, maxNum);
      if (!rangeValidation.valid) {
        toast.error(rangeValidation.message);
        return;
      }

      if (commNum < 0 || commNum > 100) {
        toast.error('CDW commission must be between 0 and 100');
        return;
      }
    }

    // Build payload (validation already passed - values are in valid range)
    const payload: StatusCommissionSettingsPayload = {
      COMPLETED: {
        type: commissionType,
        percentageRate: isFixedMode
          ? undefined
          : parseFloat(platformCommissionPct),
        fixedAmount: isFixedMode
          ? parseFloat(platformCommissionFixed)
          : undefined,
      },
      OPERATOR_FAULT: {
        type: 'PERCENTAGE',
        penaltyPercentage: parseFloat(operatorFaultPct),
        yalaRidePercentage: 100,
      },
      LATE_CANCEL: {
        type: commissionType,
        percentageRate: parseFloat(lateCancel.penaltyPct),
        splitPercentage: isFixedMode
          ? undefined
          : parseFloat(lateCancel.yalaRideShare),
        fixedAmount: isFixedMode
          ? parseFloat(lateCancel.yalaRideShare)
          : undefined,
      },
      NO_SHOW: {
        type: commissionType,
        percentageRate: parseFloat(noShow.penaltyPct),
        splitPercentage: isFixedMode
          ? undefined
          : parseFloat(noShow.yalaRideShare),
        fixedAmount: isFixedMode ? parseFloat(noShow.yalaRideShare) : undefined,
      },
      CUSTOMER_FAULT: {
        type: commissionType,
        percentageRate: parseFloat(customerFault.penaltyPct),
        splitPercentage: isFixedMode
          ? undefined
          : parseFloat(customerFault.yalaRideShare),
        fixedAmount: isFixedMode
          ? parseFloat(customerFault.yalaRideShare)
          : undefined,
      },
    };

    const executeSave = async () => {
      // 1. Commission settings (main)
      await setStatusSettings.mutateAsync(payload);

      // 2. Fixed amounts (only in fixed mode)
      if (isFixedMode) {
        await setFixedAmounts.mutateAsync({
          lateCancel: parseFloat(lateCancel.yalaRideShare) || 0,
          noShow: parseFloat(noShow.yalaRideShare) || 0,
          customerFault: parseFloat(customerFault.yalaRideShare) || 0,
        });
        await setEdgeCase.mutateAsync({
          edgeCaseHandling: edgeCaseCAP ? 'CAP' : 'OWE',
        });
      }

      // 3. CDW settings
      await updateCDWSettings.mutateAsync({
        cdwEnabled,
        ...(cdwEnabled && {
          cdwMinPercentage: parseFloat(cdwMin),
          cdwMaxPercentage: parseFloat(cdwMax),
          cdwCommissionPercentage: parseFloat(cdwCommission),
        }),
      });

      // 4. Invalidate queries once at the end
      await queryClient.invalidateQueries({
        queryKey: ['company-settings', companyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['company-cdw-settings', companyId],
      });
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await executeSave();
        setHasUnsavedChanges(false);
        toast.success('All settings saved successfully');
        navigate(`/companies/${companyId}/commission-settings`);
        return;
      } catch (e: any) {
        lastError = e;
        if (e?.response?.status === 429 && attempt < maxRetries) {
          const waitSec = 3;
          toast.info(`Too many requests. Retrying in ${waitSec} seconds...`);
          await sleep(waitSec * 1000);
        } else {
          break;
        }
      }
    }

    if (lastError?.response?.status === 429) {
      toast.error(
        'Too many requests. Please wait 30–60 seconds and try again.',
      );
    } else if (lastError?.response?.status === 422) {
      // Show API validation constraints
      const errData = lastError?.response?.data;
      const errors = errData?.errors as
        | Array<{ field?: string; constraints?: string[] }>
        | undefined;
      const constraints = errors?.flatMap((e) => e.constraints ?? []) ?? [];
      const uniqueMsg =
        [...new Set(constraints)].join('. ') ||
        errData?.message ||
        'Validation failed';
      toast.error(uniqueMsg);
    } else {
      const errorMsg =
        lastError?.response?.data?.message || 'Failed to save settings';
      toast.error(errorMsg);
    }
    console.error('Save settings error:', lastError);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/companies/${companyId}`)}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Company Details
          </Button>
          <div className="flex items-center gap-2">
            {company.isVerified && (
              <Button
                size="sm"
                className="rounded-full bg-green-600 px-4 py-1.5 text-white hover:bg-green-700"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Verified
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-gray-300 px-4 py-1.5"
              onClick={() =>
                navigate(`/companies/${companyId}/commission-settings`)
              }
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Dark Header Bar */}
        <div className="rounded-xl bg-zinc-900 px-6 py-5 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F56304]">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Commission Settings
                </h2>
                <p className="mt-0.5 text-sm text-zinc-400">
                  View earning structure details
                </p>
              </div>
            </div>
            <div className="flex rounded-full bg-white/10 p-1">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  !isFixedMode
                    ? 'text-white shadow'
                    : 'text-zinc-300 hover:text-white'
                }`}
                style={
                  !isFixedMode
                    ? { backgroundColor: COMMISSION_ORANGE }
                    : undefined
                }
                onClick={() => handleModeClick('PERCENTAGE')}
              >
                % Percentage
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isFixedMode
                    ? 'text-white shadow'
                    : 'text-zinc-300 hover:text-white'
                }`}
                style={
                  isFixedMode
                    ? { backgroundColor: COMMISSION_ORANGE }
                    : undefined
                }
                onClick={() => handleModeClick('FIXED')}
              >
                $ Fixed
              </button>
            </div>
          </div>
        </div>

        {settingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
          </div>
        ) : (
          <>
            {/* Commission Mode Guide - blue info box */}
            <Card className="rounded-lg border border-blue-200 bg-blue-50/60 shadow-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    Commission Mode Guide
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <strong>Percentage mode:</strong> Applies customer penalty
                    first, then splits the deducted amount between YalaRide and
                    operator.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <strong>Fixed mode:</strong> Directly deducts a fixed amount
                    from the operator.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Row 1: Complete + Operator Fault (2 cards) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Complete - Platform Commission */}
              <Card className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                      <Percent className="h-4 w-4 text-[#F56304]" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      Complete
                    </CardTitle>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {isFixedMode
                      ? 'Platform Commission (Fixed)'
                      : 'Platform Commission (%)'}
                  </p>
                  <div className="mt-1.5 flex items-center">
                    <Input
                      type="number"
                      min={0.01}
                      max={isFixedMode ? undefined : 100}
                      step={isFixedMode ? 0.01 : 0.5}
                      value={
                        isFixedMode
                          ? platformCommissionFixed
                          : platformCommissionPct
                      }
                      onChange={(e) =>
                        isFixedMode
                          ? setPlatformCommissionFixed(e.target.value)
                          : setPlatformCommissionPct(e.target.value)
                      }
                      placeholder={isFixedMode ? 'e.g. 10' : '0.01–100'}
                      className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {isFixedMode ? 'USD' : '%'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Operator Fault */}
              <Card className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <AlertTriangle className="h-4 w-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      Operator Fault
                    </CardTitle>
                  </div>
                  <p className="mt-1 text-xs text-green-600">
                    Percentage-based only • Charged from Customer
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Penalty Rate (%)
                  </p>
                  <div className="mt-1.5 flex items-center">
                    <Input
                      type="number"
                      min={0.01}
                      max={100}
                      step={0.5}
                      value={operatorFaultPct}
                      onChange={(e) => setOperatorFaultPct(e.target.value)}
                      placeholder="0.01–100"
                      className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                    />
                    <span className="ml-2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="mt-2 text-xs italic text-muted-foreground">
                    Full penalty amount goes to Yalaride (no split with
                    operator)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Late Cancel, No Show, Customer Fault (3 cards) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PenaltyEditCard
                title="Late Cancel"
                icon={<Clock className="h-4 w-4 text-[#F56304]" />}
                penaltyPct={lateCancel.penaltyPct}
                setPenaltyPct={(v) =>
                  setLateCancel((p) => ({ ...p, penaltyPct: v }))
                }
                yalaRideShare={lateCancel.yalaRideShare}
                setYalaRideShare={(v) =>
                  setLateCancel((p) => ({ ...p, yalaRideShare: v }))
                }
                isFixedMode={isFixedMode}
              />
              <PenaltyEditCard
                title="No Show"
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                penaltyPct={noShow.penaltyPct}
                setPenaltyPct={(v) =>
                  setNoShow((p) => ({ ...p, penaltyPct: v }))
                }
                yalaRideShare={noShow.yalaRideShare}
                setYalaRideShare={(v) =>
                  setNoShow((p) => ({ ...p, yalaRideShare: v }))
                }
                isFixedMode={isFixedMode}
              />
              <PenaltyEditCard
                title="Customer Fault"
                icon={<Users className="h-4 w-4 text-blue-500" />}
                penaltyPct={customerFault.penaltyPct}
                setPenaltyPct={(v) =>
                  setCustomerFault((p) => ({ ...p, penaltyPct: v }))
                }
                yalaRideShare={customerFault.yalaRideShare}
                setYalaRideShare={(v) =>
                  setCustomerFault((p) => ({ ...p, yalaRideShare: v }))
                }
                isFixedMode={isFixedMode}
              />
            </div>

            {/* Edge Case Rules - Only shown in Fixed mode */}
            {isFixedMode && (
              <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        <Info className="h-4 w-4 text-gray-600" />
                      </div>
                      <h3 className="text-sm font-semibold">Edge Case Rules</h3>
                    </div>
                    <Switch
                      checked={true}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        edgeCaseOWE
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => {
                        setEdgeCaseOWE(true);
                        setEdgeCaseCAP(false);
                      }}
                    >
                      <span className="text-sm font-medium">
                        OWE - Company Owes Difference
                      </span>
                      <Switch
                        checked={edgeCaseOWE}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEdgeCaseOWE(true);
                            setEdgeCaseCAP(false);
                          }
                        }}
                        className="shrink-0 data-[state=checked]:bg-green-600"
                      />
                    </div>
                    <div
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        edgeCaseCAP
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => {
                        setEdgeCaseCAP(true);
                        setEdgeCaseOWE(false);
                      }}
                    >
                      <span className="text-sm font-medium">
                        CAP - Commission Capped at Penalty Amount
                      </span>
                      <Switch
                        checked={edgeCaseCAP}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEdgeCaseCAP(true);
                            setEdgeCaseOWE(false);
                          }
                        }}
                        className="shrink-0 data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CDW card */}
            <Card className="overflow-hidden rounded-xl border border-l-4 border-l-green-500 border-gray-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">
                        CDW (Collision Damage Waiver)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Insurance coverage settings
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={cdwEnabled}
                    onCheckedChange={setCdwEnabled}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      MIN BRACKET
                    </Label>
                    <div className="mt-1.5 flex items-center">
                      <Input
                        type="number"
                        min={0}
                        value={cdwMin}
                        onChange={(e) => setCdwMin(e.target.value)}
                        disabled={!cdwEnabled}
                        className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                      />
                      <span className="ml-2 text-sm font-medium text-[#F56304]">
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      MAX BRACKET
                    </Label>
                    <div className="mt-1.5 flex items-center">
                      <Input
                        type="number"
                        min={0}
                        value={cdwMax}
                        onChange={(e) => setCdwMax(e.target.value)}
                        disabled={!cdwEnabled}
                        className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                      />
                      <span className="ml-2 text-sm font-medium text-[#F56304]">
                        %
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      COMMISSION
                    </Label>
                    <div className="mt-1.5 flex items-center">
                      <Input
                        type="number"
                        min={0}
                        value={cdwCommission}
                        onChange={(e) => setCdwCommission(e.target.value)}
                        disabled={!cdwEnabled}
                        className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                      />
                      <span className="ml-2 text-sm font-medium text-[#F56304]">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                  <Info className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="text-xs text-blue-700">
                    Operator sets CDW within bracket range
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  You have unsaved changes
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={setStatusSettings.isPending}
                className={`rounded-lg text-white hover:bg-[#e05503] ${hasUnsavedChanges ? 'bg-[#F56304] animate-pulse' : 'bg-[#F56304]'}`}
              >
                {setStatusSettings.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Mode Change Warning Modal */}
      <Dialog open={modeChangeModalOpen} onOpenChange={setModeChangeModalOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-center">
              Mode Change Warning
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm commission mode change
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertTriangle
                className="h-5 w-5 shrink-0 text-amber-500"
                strokeWidth={2}
              />
              <div className="text-sm">
                <p className="font-semibold text-red-800">
                  Data Loss Warning: Changing commission mode from{' '}
                  {commissionType === 'PERCENTAGE' ? 'Percentage' : 'Fixed'} to{' '}
                  {pendingMode === 'FIXED' ? 'Fixed' : 'Percentage'} will
                  permanently delete all previously saved commission settings
                  and data.
                </p>
              </div>
            </div>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>All current commission rates will be lost</li>
              <li>Customer penalty structures will be reset</li>
              <li>Edge case rules will be removed</li>
            </ol>
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <AlertTriangle
                className="h-5 w-5 shrink-0 text-amber-500"
                strokeWidth={2}
              />
              <div>
                <p className="font-semibold text-blue-800">
                  Important Note: This action cannot be undone. Make sure you
                  have backed up any important data before proceeding.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-lg border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setModeChangeModalOpen(false);
                setPendingMode(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg bg-[#F56304] text-white hover:bg-[#e05503]"
              onClick={confirmModeChange}
            >
              Yes, Change Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PenaltyEditCard({
  title,
  icon,
  penaltyPct,
  setPenaltyPct,
  yalaRideShare,
  setYalaRideShare,
  isFixedMode,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  penaltyPct: string;
  setPenaltyPct: (v: string) => void;
  yalaRideShare: string;
  setYalaRideShare: (v: string) => void;
  isFixedMode: boolean;
  className?: string;
}) {
  return (
    <Card
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
            {icon}
          </div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-[#F56304] font-semibold">1</span>
              Penalty Rate (%) - From Customer
            </Label>
            <div className="mt-1.5 flex items-center">
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.5}
                value={penaltyPct}
                onChange={(e) => setPenaltyPct(e.target.value)}
                placeholder="0.01–100"
                className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
              />
              <span className="ml-2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-[#F56304] font-semibold">2</span>
              YalaRide Share - From Deducted
            </Label>
            <div className="mt-1.5 flex items-center">
              <Input
                type="number"
                min={isFixedMode ? 0.01 : 0}
                max={100}
                step={isFixedMode ? 0.01 : 0.5}
                value={yalaRideShare}
                onChange={(e) => setYalaRideShare(e.target.value)}
                placeholder={isFixedMode ? 'e.g. 10' : '0–100'}
                className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
              />
              <span className="ml-2 text-sm text-muted-foreground">
                {isFixedMode ? 'USD' : '%'}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-green-50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" />
              Remaining goes to operator
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CompanyCommissionSettingsEditPage;
