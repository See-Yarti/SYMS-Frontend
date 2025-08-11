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

function toCurrency(n: number) {
  const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  return nf.format(Number.isFinite(n) ? n : 0);
}

function normalizeRatesData(obj: any): RateRow[] {
  if (!obj || typeof obj !== 'object') return [];
  const keys = Object.keys(obj).filter((k) => !['total', 'page', 'limit'].includes(k));
  return keys.map((k) => {
    const r = obj[k] ?? {};
    const nestedSlug = r?.companyCarClass?.carClass?.slug || r?.companyCarClass?.carClass?.name;
    const car = nestedSlug || r.carClassName || 'Unknown';
    const begin =
      r.startDate ??
      (r.startDateTime ? new Date(r.startDateTime).toLocaleDateString('en-GB') : '—');
    const end =
      r.endDate ??
      (r.endDateTime ? new Date(r.endDateTime).toLocaleDateString('en-GB') : '—');

    return {
      id: String(r.id ?? k),
      car,
      begin: String(begin),
      end: String(end),
      daily: Number(r.dailyBaseRate ?? 0),
      weekly: Number(r.weeklyBaseRate ?? 0),
      monthly: Number(r.monthlyBaseRate ?? 0),
      isInBlackout: Boolean(r.isInBlackout),
    };
  });
}

export default function RatesPage() {
  const { locationId = '' } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((s) => s.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(companyId && locationId);

  // Rates (list by location) — NOTE: "gel-all"
  const {
    data: ratesRaw,
    error: ratesErrObj,
    isError: ratesError,
    isLoading: ratesLoading,
    refetch: refetchRates,
  } = useFetchData<any>(
    canOperate ? `company-car-class-rate/gel-all/${locationId}` : '',
    ['rates', locationId || ''],
    { enabled: canOperate, retry: false }
  );

  const rows: RateRow[] = React.useMemo(() => {
    const payload = ratesRaw?.data ?? ratesRaw ?? {};
    return normalizeRatesData(payload);
  }, [ratesRaw]);

  // Car classes for dropdowns: GET /api/car-class/filter-car-classes
  const {
    data: carClassesRaw,
    isLoading: carClassesLoading,
    isError: carClassesError,
  } = useFetchData<any>(
    'car-class/filter-car-classes',
    ['car-classes'],
    { enabled: true, retry: false }
  );

  const carClassOptions: CarClassOption[] = React.useMemo(() => {
    const list = (carClassesRaw?.data ?? carClassesRaw ?? []) as Array<any>;
    return Array.isArray(list)
      ? list
        .filter((c) => c?.id && (c?.name || c?.slug))
        .map((c) => ({ value: c.id, label: c.name || c.slug }))
      : [];
  }, [carClassesRaw]);

  // Create / Delete
  const { mutateAsync: createRate, isPending: creating } = usePostJson<any, any>(
    'company-car-class-rate',
    {
      onSuccess: () => {
        toast.success('Rate created');
        refetchRates();
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || 'Failed to create rate'),
    }
  );
  const { mutateAsync: deleteRate, isPending: deleting } = useDeleteData({
    onSuccess: () => {
      toast.success('Rate deleted');
      refetchRates();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Failed to delete rate'),
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

  const handleAddRate = async (payload: any) => {
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
                  {(ratesErrObj as any)?.response?.data?.message || 'Failed to load rates.'}
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
