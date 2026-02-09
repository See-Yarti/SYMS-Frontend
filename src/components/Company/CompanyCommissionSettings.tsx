'use client';

// Company Commission Settings page - matches design images exactly

import { useParams, useNavigate } from '@/hooks/useNextNavigation';
import { useGetCompany } from '@/hooks/useCompanyApi';
import { useGetCompanySettings as useGetCompanySettingsOld } from '@/hooks/usePlansApi';
import { useGetCompanySettings } from '@/hooks/useCDWApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowLeft,
  Check,
  Pencil,
  Settings,
  TrendingUp,
  Zap,
  BarChart3,
  Clock,
  XCircle,
  Users,
  Shield,
  Percent,
  DollarSign,
} from 'lucide-react';
import type { StatusCommissionSetting } from '@/types/company';

function CompanyCommissionSettingsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const {
    data: companyRes,
    isLoading: companyLoading,
    error: companyError,
  } = useGetCompany(companyId || '');
  const {
    data: settingsResOld,
    isLoading: settingsLoadingOld,
    error: settingsErrorOld,
  } = useGetCompanySettingsOld(companyId || '');
  const {
    data: settingsRes,
    isLoading: settingsLoading,
    error: settingsError,
  } = useGetCompanySettings(companyId || '');

  // Check for 429 rate limit error
  const is429Error =
    (settingsErrorOld as any)?.response?.status === 429 ||
    (settingsError as any)?.response?.status === 429;

  // Show loading state until ALL data is loaded
  if (companyLoading || settingsLoadingOld || settingsLoading || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
      </div>
    );
  }

  // Handle 429 rate limit error
  if (is429Error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-center max-w-md">
          <p className="text-amber-800 font-medium mb-2">Too Many Requests</p>
          <p className="text-amber-600 text-sm">
            Please wait a moment and try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
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

  // Use old settings API for commission data
  const settingsOld = settingsResOld?.data?.settings as any;
  const scs = settingsOld?.statusCommissionSettings || {};

  // Commission type: prefer COMPLETED.type (updated by status-commission-settings API)
  // Fallback to settings.commissionType when statusCommissionSettings not set
  const completedSetting = scs.COMPLETED as StatusCommissionSetting | undefined;
  const commissionType = (completedSetting?.type ||
    settingsOld?.commissionType ||
    'PERCENTAGE') as 'PERCENTAGE' | 'FIXED';
  const isFixedMode = commissionType === 'FIXED';

  const effectiveRate =
    settingsOld?.effectiveCommissionRate ||
    settingsResOld?.data?.baseCommissionRate ||
    '0';
  const fixedCommissionAmount =
    settingsOld?.fixedCommissionAmount != null
      ? typeof settingsOld.fixedCommissionAmount === 'number'
        ? settingsOld.fixedCommissionAmount
        : parseFloat(settingsOld.fixedCommissionAmount) || 0
      : parseFloat(effectiveRate) || 0;
  const baseRateNum = parseFloat(String(effectiveRate)) || 0;
  const operatorShare = 100 - baseRateNum;
  const edgeCase = settingsOld?.edgeCaseHandling || 'CAP';

  // Use new settings API for CDW data
  // useFetchData already extracts data.data, so settingsRes is CompanySettingsResponse directly
  const cdwSettings = settingsRes?.settings?.cdw || null;

  // Get status commission settings
  const lateCancelSetting = scs.LATE_CANCEL as
    | StatusCommissionSetting
    | undefined;
  const noShowSetting = scs.NO_SHOW as StatusCommissionSetting | undefined;
  const customerFaultSetting = scs.CUSTOMER_FAULT as
    | StatusCommissionSetting
    | undefined;
  const operatorFaultSetting = scs.OPERATOR_FAULT as
    | StatusCommissionSetting
    | undefined;

  return (
    <div className="min-h-screen">
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
            {/* Commission Type Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
              {/* {isFixedMode ? <DollarSign className="h-4 w-4" /> : <Percent className="h-4 w-4" />} */}
              {isFixedMode ? 'FIXED' : '% PERCENTAGE'}
            </div>
            {/* Verified Badge */}
            {company.isVerified && (
              <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                <Check className="h-4 w-4" />
                Verified
              </div>
            )}
            {/* Edit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/companies/${companyId}/commission-settings/edit`)
              }
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <div className="rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F56304]">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Commission Settings</h1>
              <p className="text-sm text-gray-300">
                View earning structure details
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="space-y-6 lg:col-span-2">
            {/* Platform Commission Card */}
            <Card className="overflow-hidden border-l-4 border-l-[#F56304] shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#F56304]" />
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[#F56304]">
                      Platform Commission
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-600" />
                    ACTIVE
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    {isFixedMode
                      ? `${fixedCommissionAmount} USD`
                      : `${baseRateNum}%`}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Base rate on completed rides
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-orange-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                      Yalaride Platform
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#F56304]">
                      {isFixedMode
                        ? `${fixedCommissionAmount} USD`
                        : `${baseRateNum}%`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                      Operator Share
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                      {isFixedMode ? 'Rest' : `${operatorShare}%`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operator Fault Penalty Card */}
            <Card className="overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F56304]">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Operator Fault Penalty</h3>
                    <p className="text-sm text-gray-300">
                      100% goes to platform - Zero operator split
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-[#F56304] px-4 py-2">
                  <span className="text-2xl font-bold">
                    {operatorFaultSetting?.penaltyPercentage || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Penalty Structures */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Customer Penalty Structures
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Late Cancel */}
                <Card className="overflow-hidden border-l-4 border-l-orange-400 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-sm font-semibold">
                        Late Cancel
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Customer Pays
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {lateCancelSetting?.percentageRate || 0}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-orange-50 p-2">
                        <p className="text-xs text-gray-600">Platform</p>
                        <p className="text-lg font-bold text-[#F56304]">
                          {lateCancelSetting?.type === 'FIXED'
                            ? `${lateCancelSetting?.fixedAmount || 0} USD`
                            : `${lateCancelSetting?.splitPercentage || 0}%`}
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-2">
                        <p className="text-xs text-gray-600">Operator</p>
                        <p className="text-lg font-bold text-green-600">
                          {lateCancelSetting?.type === 'FIXED'
                            ? 'Rest'
                            : `${(lateCancelSetting?.percentageRate || 0) - (lateCancelSetting?.splitPercentage || 0)}%`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* No Show */}
                <Card className="overflow-hidden border-l-4 border-l-red-400 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <CardTitle className="text-sm font-semibold">
                        No Show
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Customer Pays
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {noShowSetting?.percentageRate || 0}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-orange-50 p-2">
                        <p className="text-xs text-gray-600">Platform</p>
                        <p className="text-lg font-bold text-[#F56304]">
                          {noShowSetting?.type === 'FIXED'
                            ? `${noShowSetting?.fixedAmount || 0} USD`
                            : `${noShowSetting?.splitPercentage || 0}%`}
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-2">
                        <p className="text-xs text-gray-600">Operator</p>
                        <p className="text-lg font-bold text-green-600">
                          {noShowSetting?.type === 'FIXED'
                            ? 'Rest'
                            : `${(noShowSetting?.percentageRate || 0) - (noShowSetting?.splitPercentage || 0)}%`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Fault */}
                <Card className="overflow-hidden border-l-4 border-l-blue-400 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-sm font-semibold">
                        Customer Fault
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Customer Pays
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {customerFaultSetting?.percentageRate || 0}%
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-orange-50 p-2">
                        <p className="text-xs text-gray-600">Platform</p>
                        <p className="text-lg font-bold text-[#F56304]">
                          {customerFaultSetting?.type === 'FIXED'
                            ? `${customerFaultSetting?.fixedAmount || 0} USD`
                            : `${customerFaultSetting?.splitPercentage || 0}%`}
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-2">
                        <p className="text-xs text-gray-600">Operator</p>
                        <p className="text-lg font-bold text-green-600">
                          {customerFaultSetting?.type === 'FIXED'
                            ? 'Rest'
                            : `${(customerFaultSetting?.percentageRate || 0) - (customerFaultSetting?.splitPercentage || 0)}%`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* CDW Insurance Card */}
            <Card
              className={`overflow-hidden shadow-sm ${cdwSettings?.cdwEnabled ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`h-5 w-5 ${cdwSettings?.cdwEnabled ? 'text-green-600' : 'text-gray-400'}`}
                    />
                    <CardTitle className="text-sm font-semibold">
                      CDW Insurance
                    </CardTitle>
                  </div>
                  {settingsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        cdwSettings?.cdwEnabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cdwSettings?.cdwEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!settingsRes ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-sm text-gray-600">Loading CDW data...</p>
                  </div>
                ) : cdwSettings?.cdwEnabled ? (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Coverage Status
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Active & Available
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Operator Bracket
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {cdwSettings.cdwMinPercentage || '0'}%
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-green-200">
                          <div className="h-2 w-1/2 rounded-full bg-green-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {cdwSettings.cdwMaxPercentage || '0'}%
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                        Platform Commission
                      </p>
                      <p className="mt-1 text-2xl font-bold text-green-700">
                        {cdwSettings.cdwCommissionPercentage || '0'}%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-sm text-gray-600">
                      CDW is not enabled for this company
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Enable it in edit mode to configure CDW settings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edge Case Rules - Only shown in Fixed mode */}
            {isFixedMode && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gray-600" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Edge Case Rules
                  </h2>
                </div>
                <div className="space-y-3">
                  {/* OWE Rule */}
                  <Card
                    className={`shadow-sm ${edgeCase === 'OWE' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-200'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            OWE Rule
                          </h3>
                          <p className="mt-1 text-xs text-gray-600">
                            Even if the collected penalty is lower, the system
                            will still consider the full fixed commission amount
                            as receivable for this booking.
                          </p>
                        </div>
                        {edgeCase === 'OWE' && (
                          <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* CAP Rule */}
                  <Card
                    className={`shadow-sm ${edgeCase === 'CAP' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-200'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            CAP Rule
                          </h3>
                          <p className="mt-1 text-xs text-gray-600">
                            Commission is limited to the collected penalty
                            amount, and any remaining commission is ignored.
                          </p>
                        </div>
                        {edgeCase === 'CAP' ? (
                          <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                        ) : (
                          <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                            OFF
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mode Card */}
                  <Card className="border-l-4 border-l-[#F56304] shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                          <DollarSign className="h-4 w-4 text-[#F56304]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            Fixed Mode
                          </h3>
                          <p className="mt-1 text-xs text-gray-600">
                            Fixed commission directly deducted from operator
                            earnings per completed ride
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Percentage Mode Card - Only shown in Percentage mode */}
            {!isFixedMode && (
              <Card className="border-l-4 border-l-[#F56304] shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                      <Percent className="h-4 w-4 text-[#F56304]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Percentage Mode
                      </h3>
                      <p className="mt-1 text-xs text-gray-600">
                        Apply penalty first, then split commission as percentage
                        between platform and operator
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyCommissionSettingsPage;
