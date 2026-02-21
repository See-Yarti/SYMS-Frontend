'use client';

// src/pages/rate/RatesPage.tsx

import * as React from 'react';
import { useParams } from '@/hooks/useNextNavigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  MoreVertical,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import NewRateDialog from '@/components/Rates/NewRateDialog';
import EditRateDialog from '@/components/Rates/EditRateDialog';

import { useAppSelector } from '@/store';
import {
  useFetchData,
  usePostJson,
  useDeleteData,
} from '@/hooks/useOperatorCarClass';

// ---------- Types ----------
type RateRow = {
  id: string;
  car: string;
  begin: string;
  end: string;
  daily: number;
  weekly: number;
  monthly: number;
  isInBlackout: boolean;
};

type CarClassOption = { value: string; label: string };

type CompanyCarClassItem = {
  id: string; // companyCarClassId
  carClass: {
    id: string;
    slug: string;
    name: string;
  };
  make: string | null;
  model: string | null;
  isAvailable: boolean;
  numberOfBags: number | null;
  numberOfDoors: number | null;
  numberOfPassengers: number | null;
};

type CreateRatePayload = {
  companyCarClassId: string;
  startDateTime: string; // dd/mm/yyyy (as your existing code formats)
  endDateTime: string;

  extraKmRate: number;

  dailyBaseRate: number;
  dailyBaseKm: number;
  dailyExtraHourRate: number;
  dailyExtraDayRate: number;
  dailyLORAdjustments: {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
    sixth: number;
  };

  weeklyBaseRate: number;
  weeklyBaseKm: number;
  weeklyExtraDayKm: number;
  weeklyExtraHourRate: number;
  weeklyExtraDayRate: number;
  weeklyLORAdjustments: {
    first: number;
    second: number;
    third: number;
    fourth: number;
  };

  monthlyBaseRate: number;
  monthlyBaseKm: number;
  monthlyExtraDayKm: number;
  monthlyExtraHourRate: number;
  monthlyExtraDayRate: number;
};

// ---------- Helpers ----------
function toCurrency(n: number) {
  const nf = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return nf.format(Number.isFinite(n) ? n : 0);
}

function normalizeRatesData(obj: unknown): RateRow[] {
  if (!obj || typeof obj !== 'object') return [];
  const keys = Object.keys(obj as Record<string, unknown>).filter(
    (k) => !['total', 'page', 'limit'].includes(k),
  );
  return keys.map((k) => {
    const r = (obj as Record<string, unknown>)[k] as
      | Record<string, unknown>
      | undefined;

    const nestedSlug =
      (r?.companyCarClass as any)?.carClass?.slug ||
      (r?.companyCarClass as any)?.carClass?.name;

    const car =
      (nestedSlug as string) || (r?.carClassName as string) || 'Unknown';

    const begin =
      (r?.startDate as string) ??
      ((r?.startDateTime as string)
        ? new Date(r?.startDateTime as string).toLocaleDateString('en-GB')
        : '—');

    const end =
      (r?.endDate as string) ??
      ((r?.endDateTime as string)
        ? new Date(r?.endDateTime as string).toLocaleDateString('en-GB')
        : '—');

    return {
      id: String((r?.id as string) ?? k),
      car,
      begin: String(begin),
      end: String(end),
      daily: Number(r?.dailyBaseRate ?? 0),
      weekly: Number(r?.weeklyBaseRate ?? 0),
      monthly: Number(r?.monthlyBaseRate ?? 0),
      isInBlackout: Boolean(r?.isInBlackout),
    };
  });
}

function getErrMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    const maybe = err?.response?.data?.message;
    if (typeof maybe === 'string' && maybe) return maybe;
    if (typeof err?.message === 'string' && err.message) return err.message;
  }
  return 'Something went wrong.';
}

// ---------- Component ----------
export default function RatesPage() {
  const { locationId = '' } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((s) => s.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(companyId && locationId);

  // Rates (list by location)
  const {
    data: ratesRaw,
    error: ratesErrObj,
    isError: ratesError,
    isLoading: ratesLoading,
    refetch: refetchRates,
  } = useFetchData<unknown>(
    canOperate ? `company-car-class-rate/get-all/${locationId}` : '',
    ['rates', locationId || ''],
    { enabled: canOperate, retry: false },
  );

  const rows: RateRow[] = React.useMemo(() => {
    const payload = (ratesRaw as { data?: unknown })?.data ?? ratesRaw ?? {};
    return normalizeRatesData(payload);
  }, [ratesRaw]);

  // ✅ Company car classes by Company + Location (NEW ENDPOINT)
  const {
    data: companyClasses,
    isLoading: carClassesLoading,
    isError: carClassesError,
  } = useFetchData<CompanyCarClassItem[]>(
    canOperate ? `company-car-class/${companyId}/${locationId}` : '',
    ['company-car-class', companyId, locationId],
    { enabled: canOperate, retry: false },
  );

  const carClassOptions: CarClassOption[] = React.useMemo(() => {
    if (!Array.isArray(companyClasses)) return [];
    return companyClasses
      .filter((c) => c?.id && c?.carClass?.name)
      .map((c) => ({
        value: c.id, // companyCarClassId to send when creating a rate
        label:
          c.carClass?.name ||
          c.carClass?.slug ||
          [c.make, c.model].filter(Boolean).join(' ') ||
          'Class',
      }));
  }, [companyClasses]);

  // Create / Delete
  const { mutate: createRate, isPending: creating } = usePostJson<
    CreateRatePayload,
    unknown
  >('company-car-class-rate', {
    onSuccess: () => {
      toast.success('Rate created');
      setDialogOpenCreate(false);
      refetchRates();
    },
    onError: (err: unknown) => toast.error(getErrMessage(err)),
  });

  const { mutateAsync: deleteRate, isPending: deleting } = useDeleteData({
    onSuccess: () => {
      toast.success('Rate deleted');
      refetchRates();
    },
    onError: (err: unknown) => toast.error(getErrMessage(err)),
  });

  // UI state
  const [dialogOpenCreate, setDialogOpenCreate] = React.useState(false);
  const [filterCarClass, setFilterCarClass] = React.useState('__ALL__');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [editOpen, setEditOpen] = React.useState(false);
  const [editingRateId, setEditingRateId] = React.useState<string | null>(null);

  const distinctCars = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.car || 'Unknown'))),
    [rows],
  );
  const filteredRows = rows.filter((r) => {
    const matchesClass =
      filterCarClass === '__ALL__' || r.car === filterCarClass;
    const matchesSearch =
      !searchQuery || r.car.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleAddRate = (payload: CreateRatePayload) => {
    createRate(payload);
  };

  const handleDelete = async (id: string) => {
    await deleteRate({ endpoint: `company-car-class-rate/${id}` });
  };

  const openEdit = (rate: RateRow) => {
    setEditingRateId(rate.id);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Rates Management</h1>
      </div>

      {/* Combined Filter + Table Card - Exact design match */}
      <div className="rounded-[20px] bg-white border border-gray-200 shadow-md overflow-hidden">
        {/* Search and Filter Bar with Add Button - Full width */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search Car Classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg border-gray-300 h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Filter by Class:
            </span>
            <Select value={filterCarClass} onValueChange={setFilterCarClass}>
              <SelectTrigger className="w-[180px] rounded-lg border-gray-300 h-10">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All Classes</SelectItem>
                {distinctCars.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchRates()}
            disabled={ratesLoading}
            className="rounded-lg border-gray-300 h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              if (!canOperate)
                return toast.error('Company and Location required');
              if (carClassesLoading || carClassesError) {
                return toast.error('Car classes not loaded yet');
              }
              setDialogOpenCreate(true);
            }}
            className="gap-2 rounded-lg bg-[#F56304] hover:bg-[#e05503] text-white h-10 px-4"
            disabled={!canOperate || creating || carClassesLoading}
          >
            <Plus className="h-4 w-4" />
            Add New Rate
          </Button>
        </div>

        {/* Table */}
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Car Class
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Period Start
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Period End
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Daily Rate
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Weekly Rate
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Monthly Rate
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRows.map((rate, idx) => (
              <tr
                key={rate.id}
                className={
                  idx % 2 === 0
                    ? 'bg-white hover:bg-gray-50/50 transition-colors'
                    : 'bg-gray-50/30 hover:bg-gray-50/50 transition-colors'
                }
              >
                <td className="px-6 py-4">
                  <span className="font-semibold text-[#F56304] text-sm">
                    {rate.car}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {rate.begin}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{rate.end}</td>
                <td className="px-6 py-4">
                  {rate.isInBlackout ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      In blackout
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {toCurrency(rate.daily)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {toCurrency(rate.weekly)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {toCurrency(rate.monthly)}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => openEdit(rate)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(rate.id)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                        disabled={deleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}

            {ratesLoading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center text-muted-foreground text-sm"
                >
                  Loading rates…
                </td>
              </tr>
            )}
            {!ratesLoading && filteredRows.length === 0 && !ratesError && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center text-muted-foreground text-sm"
                >
                  {searchQuery || filterCarClass !== '__ALL__' ? (
                    <span>No rates found matching your filters.</span>
                  ) : canOperate ? (
                    <span>
                      No rates found. Click <b>Add New Rate</b> to get started.
                    </span>
                  ) : (
                    <span>Company and Location required.</span>
                  )}
                </td>
              </tr>
            )}
            {ratesError && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center text-destructive text-sm"
                >
                  {getErrMessage(ratesErrObj)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create */}
      <NewRateDialog
        open={dialogOpenCreate}
        onClose={() => setDialogOpenCreate(false)}
        onAddRate={handleAddRate}
        carClasses={carClassOptions}
      />

      {/* Edit */}
      <EditRateDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingRateId(null);
        }}
        rateId={editingRateId}
        locationId={locationId}
        carClasses={carClassOptions}
        onSaved={() => {
          setEditOpen(false);
          setEditingRateId(null);
          refetchRates();
        }}
      />
    </div>
  );
}
