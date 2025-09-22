// src/pages/rate/RatesPage.tsx

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, RefreshCw, Car, Calendar, BadgeDollarSign } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

import NewRateDialog from '@/components/Rates/NewRateDialog';
import EditRateDialog from '@/components/Rates/EditRateDialog';

import { useAppSelector } from '@/store';
import { useFetchData, usePostJson, useDeleteData } from '@/hooks/useOperatorCarClass';

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
    first: number; second: number; third: number; fourth: number; fifth: number; sixth: number;
  };

  weeklyBaseRate: number;
  weeklyBaseKm: number;
  weeklyExtraDayKm: number;
  weeklyExtraHourRate: number;
  weeklyExtraDayRate: number;
  weeklyLORAdjustments: {
    first: number; second: number; third: number; fourth: number;
  };

  monthlyBaseRate: number;
  monthlyBaseKm: number;
  monthlyExtraDayKm: number;
  monthlyExtraHourRate: number;
  monthlyExtraDayRate: number;
};

// ---------- Helpers ----------
function toCurrency(n: number) {
  const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  return nf.format(Number.isFinite(n) ? n : 0);
}

function normalizeRatesData(obj: unknown): RateRow[] {
  if (!obj || typeof obj !== 'object') return [];
  const keys = Object.keys(obj as Record<string, unknown>).filter((k) => !['total', 'page', 'limit'].includes(k));
  return keys.map((k) => {
    const r = (obj as Record<string, unknown>)[k] as Record<string, unknown> | undefined;

    const nestedSlug =
      (r?.companyCarClass as any)?.carClass?.slug ||
      (r?.companyCarClass as any)?.carClass?.name;

    const car = (nestedSlug as string) || (r?.carClassName as string) || 'Unknown';

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
    const maybe = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    if (typeof maybe === 'string' && maybe) return maybe;
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
    canOperate ? `company-car-class-rate/gel-all/${locationId}` : '',
    ['rates', locationId || ''],
    { enabled: canOperate, retry: false }
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
    { enabled: canOperate, retry: false }
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
  const { mutateAsync: createRate, isPending: creating } = usePostJson<CreateRatePayload, unknown>(
    'company-car-class-rate',
    {
      onSuccess: () => {
        toast.success('Rate created');
        refetchRates();
      },
      onError: (err: unknown) => toast.error(getErrMessage(err)),
    }
  );

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

  const [editOpen, setEditOpen] = React.useState(false);
  const [editingRateId, setEditingRateId] = React.useState<string | null>(null);

  const distinctCars = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.car || 'Unknown'))),
    [rows]
  );
  const filteredRows = rows.filter(
    (r) => filterCarClass === '__ALL__' || r.car === filterCarClass
  );

  const handleAddRate = async (payload: CreateRatePayload) => {
    await createRate(payload);
    setDialogOpenCreate(false);
  };

  const handleDelete = async (id: string) => {
    await deleteRate({ endpoint: `company-car-class-rate/${id}` });
  };

  const openEdit = (rate: RateRow) => {
    setEditingRateId(rate.id);
    setEditOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 ">
            <BadgeDollarSign className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Rates Management</h1>
          </div>
          <p className="text-muted-foreground text-base">
            Manage rates for each class and period. Click “New Rate” to add, or use the pencil to edit.
          </p>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            onClick={() => {
              if (!canOperate) return toast.error('Company and Location required');
              if (carClassesLoading || carClassesError) {
                return toast.error('Car classes not loaded yet');
              }
              setDialogOpenCreate(true);
            }}
            className="gap-2 rounded-xl shadow-md"
            variant="default"
            disabled={!canOperate || creating || carClassesLoading}
          >
            <Plus className="h-5 w-5" />
            New Rate
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => refetchRates()}
            disabled={ratesLoading}
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 bg-muted/60 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Car className="w-4 h-4" /> Car Class
          </Label>
        </div>
        <Select value={filterCarClass} onValueChange={setFilterCarClass}>
          <SelectTrigger className="w-40 rounded-lg shadow">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">All</SelectItem>
            {distinctCars.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-background/90 rounded-2xl border border-muted shadow-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Car</TableHead>
              <TableHead>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Begin
                </span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> End
                </span>
              </TableHead>
              <TableHead>Blackouts</TableHead>
              <TableHead className="text-right">Daily</TableHead>
              <TableHead className="text-right">Weekly</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((rate, idx) => (
              <TableRow
                key={rate.id}
                className={
                  rate.isInBlackout
                    ? 'bg-red-100 hover:bg-red-200'
                    : idx % 2 === 0
                      ? 'bg-muted/30'
                      : ''
                }
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/20"
                    title="Edit"
                    onClick={() => openEdit(rate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <Car className="w-3 h-3" /> {rate.car}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {rate.begin}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {rate.end}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      rate.isInBlackout
                        ? 'text-red-700 font-semibold'
                        : 'text-muted-foreground italic'
                    }
                  >
                    {rate.isInBlackout ? 'In blackout' : 'Not in blackout'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {toCurrency(rate.daily)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {toCurrency(rate.weekly)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {toCurrency(rate.monthly)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => handleDelete(rate.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {ratesLoading && (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  Loading rates…
                </TableCell>
              </TableRow>
            )}
            {!ratesLoading && filteredRows.length === 0 && !ratesError && (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  {canOperate ? 'No rates found for this location.' : 'Company and Location required.'}
                </TableCell>
              </TableRow>
            )}
            {ratesError && (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-destructive">
                  {getErrMessage(ratesErrObj)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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