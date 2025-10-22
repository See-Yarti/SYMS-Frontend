// src/components/Rates/EditRateDialog.tsx

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { useFetchData, usePatchDataBlackout } from '@/hooks/useOperatorCarClass';
import { toast } from 'sonner';

// ---------------- Types ----------------
type CarClassOption = { value: string; label: string };

type DailyLOR = {
  first: number; second: number; third: number; fourth: number; fifth: number; sixth: number;
};
type WeeklyLOR = {
  first: number; second: number; third: number; fourth: number;
};

// The shape we need from the server list (edit screen uses just these fields)
type RateServerItem = {
  id: string;
  companyCarClassId?: string;
  companyCarClass?: { id?: string } | null;

  startDateTime?: string; // can be dd/mm/yyyy or ISO
  endDateTime?: string;

  extraKmRate?: number;

  dailyBaseRate?: number;
  dailyBaseKm?: number;
  dailyExtraHourRate?: number;
  dailyExtraDayRate?: number;
  dailyLORAdjustments?: Partial<DailyLOR> | null;

  weeklyBaseRate?: number;
  weeklyBaseKm?: number;
  weeklyExtraDayKm?: number;
  weeklyExtraHourRate?: number;
  weeklyExtraDayRate?: number;
  weeklyLORAdjustments?: Partial<WeeklyLOR> | null;

  monthlyBaseRate?: number;
  monthlyBaseKm?: number;
  monthlyExtraDayKm?: number;
  monthlyExtraHourRate?: number;
  monthlyExtraDayRate?: number;
};

// We fetch "get-all/:locationId" which returns an object-like bag with entries and some meta keys
type RateListBag = Record<string, unknown> & {
  total?: unknown;
  page?: unknown;
  limit?: unknown;
};

// ---------------- Consts ----------------
const DEFAULT_DAILY_LOR: DailyLOR = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0, sixth: 0 };
const DEFAULT_WEEKLY_LOR: WeeklyLOR = { first: 0, second: 0, third: 0, fourth: 0 };

// ---------------- Helpers ----------------
const toApiDate = (yyyyMmDd: string) => {
  if (!yyyyMmDd) return '';
  const [y, m, d] = yyyyMmDd.split('-');
  return `${d}/${m}/${y}`;
};

const toInputDate = (raw?: string) => {
  if (!raw) return '';
  const iso = Date.parse(raw);
  if (!Number.isNaN(iso)) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
};

function getErrMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const maybe =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    if (typeof maybe === 'string' && maybe) return maybe;
  }
  return 'Something went wrong.';
}

function isRateServerItem(v: unknown): v is RateServerItem {
  return !!v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string';
}

function extractServerItem(listRaw: unknown, rateId: string | null): RateServerItem | null {
  if (!rateId) return null;
  const bag = (listRaw as { data?: unknown })?.data ?? listRaw;
  if (!bag || typeof bag !== 'object') return null;

  const obj = bag as RateListBag;
  const keys = Object.keys(obj).filter((k) => !['total', 'page', 'limit'].includes(k));
  for (const k of keys) {
    const candidate = obj[k];
    if (isRateServerItem(candidate) && candidate.id === rateId) {
      return candidate;
    }
  }
  return null;
}

function NumberInput({
  value,
  onValue,
  step,
  min,
  className,
  inputProps,
}: {
  value: number;
  onValue: (n: number) => void;
  step?: string | number;
  min?: number;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const [text, setText] = React.useState<string>(String(value ?? 0));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setText(String(value ?? 0));
  }, [value, focused]);

  return (
    <Input
      type="number"
      value={focused && value === 0 && text === '0' ? '' : text}
      onFocus={(e) => {
        setFocused(true);
        if (text === '0') setText('');
        queueMicrotask(() => e.currentTarget.select());
      }}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        if (v === '' || v === '-' || v === '.' || v === '-.') {
          onValue(0); return;
        }
        const n = Number(v);
        onValue(Number.isFinite(n) ? n : 0);
      }}
      onBlur={() => {
        setFocused(false);
        if (text === '' || text === '-' || text === '.' || text === '-.') {
          setText('0'); onValue(0);
        } else {
          const n = Number(text);
          setText(String(Number.isFinite(n) ? n : 0));
          onValue(Number.isFinite(n) ? n : 0);
        }
      }}
      step={step}
      min={min}
      className={className}
      {...inputProps}
    />
  );
}

// ---------------- Component ----------------
export default function EditRateDialog({
  open,
  onClose,
  rateId,
  locationId,
  carClasses,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  rateId: string | null;
  locationId: string;
  carClasses: CarClassOption[];
  onSaved?: () => void;
}) {
  // Fetch list by location, then pick item by id (API: get-all/:locationId)
  const {
    data: listRaw,
    isLoading: listLoading,
    isError,
    error,
  } = useFetchData<unknown>(
    open && locationId ? `company-car-class-rate/get-all/${locationId}` : '',
    ['rate-list-for-edit', locationId],
    { enabled: Boolean(open && locationId) }
  );

  const serverItem = React.useMemo<RateServerItem | null>(
    () => extractServerItem(listRaw, rateId),
    [listRaw, rateId]
  );

  // Local state (same as New)
  const [companyCarClassId, setCompanyCarClassId] = React.useState('');
  const [startDate, setStartDate] = React.useState(''); // yyyy-MM-dd
  const [endDate, setEndDate] = React.useState('');
  const [extraKmRate, setExtraKmRate] = React.useState<number>(0);

  const [dailyBaseRate, setDailyBaseRate] = React.useState<number>(0);
  const [dailyBaseKm, setDailyBaseKm] = React.useState<number>(0);
  const [dailyExtraHourRate, setDailyExtraHourRate] = React.useState<number>(0);
  const [dailyExtraDayRate, setDailyExtraDayRate] = React.useState<number>(0);
  const [dailyLOR, setDailyLOR] = React.useState<DailyLOR>({ ...DEFAULT_DAILY_LOR });

  const [weeklyBaseRate, setWeeklyBaseRate] = React.useState<number>(0);
  const [weeklyBaseKm, setWeeklyBaseKm] = React.useState<number>(0);
  const [weeklyExtraDayKm, setWeeklyExtraDayKm] = React.useState<number>(0);
  const [weeklyExtraHourRate, setWeeklyExtraHourRate] = React.useState<number>(0);
  const [weeklyExtraDayRate, setWeeklyExtraDayRate] = React.useState<number>(0);
  const [weeklyLOR, setWeeklyLOR] = React.useState<WeeklyLOR>({ ...DEFAULT_WEEKLY_LOR });

  const [monthlyBaseRate, setMonthlyBaseRate] = React.useState<number>(0);
  const [monthlyBaseKm, setMonthlyBaseKm] = React.useState<number>(0);
  const [monthlyExtraDayKm, setMonthlyExtraDayKm] = React.useState<number>(0);
  const [monthlyExtraHourRate, setMonthlyExtraHourRate] = React.useState<number>(0);
  const [monthlyExtraDayRate, setMonthlyExtraDayRate] = React.useState<number>(0);

  // Hydrate when item is found
  React.useEffect(() => {
    if (!open || !serverItem) return;

    const cccId = serverItem.companyCarClassId || serverItem.companyCarClass?.id || '';
    setCompanyCarClassId(cccId);

    setStartDate(toInputDate(serverItem.startDateTime));
    setEndDate(toInputDate(serverItem.endDateTime));
    setExtraKmRate(Number(serverItem.extraKmRate ?? 0));

    setDailyBaseRate(Number(serverItem.dailyBaseRate ?? 0));
    setDailyBaseKm(Number(serverItem.dailyBaseKm ?? 0));
    setDailyExtraHourRate(Number(serverItem.dailyExtraHourRate ?? 0));
    setDailyExtraDayRate(Number(serverItem.dailyExtraDayRate ?? 0));
    setDailyLOR({
      first: Number(serverItem.dailyLORAdjustments?.first ?? 0),
      second: Number(serverItem.dailyLORAdjustments?.second ?? 0),
      third: Number(serverItem.dailyLORAdjustments?.third ?? 0),
      fourth: Number(serverItem.dailyLORAdjustments?.fourth ?? 0),
      fifth: Number(serverItem.dailyLORAdjustments?.fifth ?? 0),
      sixth: Number(serverItem.dailyLORAdjustments?.sixth ?? 0),
    });

    setWeeklyBaseRate(Number(serverItem.weeklyBaseRate ?? 0));
    setWeeklyBaseKm(Number(serverItem.weeklyBaseKm ?? 0));
    setWeeklyExtraDayKm(Number(serverItem.weeklyExtraDayKm ?? 0));
    setWeeklyExtraHourRate(Number(serverItem.weeklyExtraHourRate ?? 0));
    setWeeklyExtraDayRate(Number(serverItem.weeklyExtraDayRate ?? 0));
    setWeeklyLOR({
      first: Number(serverItem.weeklyLORAdjustments?.first ?? 0),
      second: Number(serverItem.weeklyLORAdjustments?.second ?? 0),
      third: Number(serverItem.weeklyLORAdjustments?.third ?? 0),
      fourth: Number(serverItem.weeklyLORAdjustments?.fourth ?? 0),
    });

    setMonthlyBaseRate(Number(serverItem.monthlyBaseRate ?? 0));
    setMonthlyBaseKm(Number(serverItem.monthlyBaseKm ?? 0));
    setMonthlyExtraDayKm(Number(serverItem.monthlyExtraDayKm ?? 0));
    setMonthlyExtraHourRate(Number(serverItem.monthlyExtraHourRate ?? 0));
    setMonthlyExtraDayRate(Number(serverItem.monthlyExtraDayRate ?? 0));
  }, [open, serverItem]);

  // keep a copy to diff for PATCH
  const originalRef = React.useRef<RateServerItem | null>(null);
  React.useEffect(() => { originalRef.current = serverItem; }, [serverItem]);

  const { mutateAsync: patchRate, isPending: saving } = usePatchDataBlackout({
    onSuccess: () => { toast.success('Rate updated'); onSaved?.(); },
    onError: (err: unknown) => toast.error(getErrMessage(err)),
  });

  // Build a minimal PATCH payload (only changed fields)
  function makePatchPayload(): Record<string, unknown> {
    const o = originalRef.current;
    const payload: Record<string, unknown> = {};
    if (!o) return payload;

    const put = (key: keyof RateServerItem | string, val: unknown) => {
      // Add if changed (shallow compare)
      const prev = (o as Record<string, unknown>)[key as string];
      if (key === 'dailyLORAdjustments' || key === 'weeklyLORAdjustments') {
        if (JSON.stringify(val) !== JSON.stringify(prev)) payload[key] = val;
      } else if (val !== prev) {
        payload[key] = val;
      }
    };

    put('companyCarClassId', companyCarClassId || o.companyCarClassId || o.companyCarClass?.id);
    put('startDateTime', toApiDate(startDate || toInputDate(o.startDateTime)));
    put('endDateTime', toApiDate(endDate || toInputDate(o.endDateTime)));

    put('extraKmRate', extraKmRate);

    put('dailyBaseRate', dailyBaseRate);
    put('dailyBaseKm', dailyBaseKm);
    put('dailyExtraHourRate', dailyExtraHourRate);
    put('dailyExtraDayRate', dailyExtraDayRate);
    const dailyAdj: DailyLOR = {
      first: dailyLOR.first, second: dailyLOR.second,
      third: dailyLOR.third, fourth: dailyLOR.fourth,
      fifth: dailyLOR.fifth, sixth: dailyLOR.sixth,
    };
    put('dailyLORAdjustments', dailyAdj);

    put('weeklyBaseRate', weeklyBaseRate);
    put('weeklyBaseKm', weeklyBaseKm);
    put('weeklyExtraDayKm', weeklyExtraDayKm);
    put('weeklyExtraHourRate', weeklyExtraHourRate);
    put('weeklyExtraDayRate', weeklyExtraDayRate);
    const weeklyAdj: WeeklyLOR = {
      first: weeklyLOR.first, second: weeklyLOR.second, third: weeklyLOR.third, fourth: weeklyLOR.fourth
    };
    put('weeklyLORAdjustments', weeklyAdj);

    put('monthlyBaseRate', monthlyBaseRate);
    put('monthlyBaseKm', monthlyBaseKm);
    put('monthlyExtraDayKm', monthlyExtraDayKm);
    put('monthlyExtraHourRate', monthlyExtraHourRate);
    put('monthlyExtraDayRate', monthlyExtraDayRate);

    return payload;
  }

  const handleSave = async () => {
    if (!rateId) return;
    const body = makePatchPayload();
    if (Object.keys(body).length === 0) {
      toast.info('No changes to save'); return;
    }
    await patchRate({ endpoint: `company-car-class-rate/${rateId}`, data: body });
  };

  const dailyTotals = React.useMemo(
    () => [
      dailyBaseRate + (dailyLOR.first || 0),
      dailyBaseRate + (dailyLOR.second || 0),
      dailyBaseRate + (dailyLOR.third || 0),
      dailyBaseRate + (dailyLOR.fourth || 0),
      dailyBaseRate + (dailyLOR.fifth || 0),
      dailyBaseRate + (dailyLOR.sixth || 0),
    ],
    [dailyBaseRate, dailyLOR]
  );
  const weeklyTotals = React.useMemo(
    () => [
      weeklyBaseRate + (weeklyLOR.first || 0),
      weeklyBaseRate + (weeklyLOR.second || 0),
      weeklyBaseRate + (weeklyLOR.third || 0),
      weeklyBaseRate + (weeklyLOR.fourth || 0),
    ],
    [weeklyBaseRate, weeklyLOR]
  );
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (n: number) => currency.format(Number.isFinite(n) ? n : 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] md:max-w-3xl lg:max-w-5xl p-0 h-[92vh]">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogHeader className="px-6 pt-4 pb-3">
            <DialogTitle className="text-xl md:text-2xl">Edit Rate</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-4">
            <div className="space-y-2">
              <Label>Car Class *</Label>
              <Select
                value={companyCarClassId}
                onValueChange={setCompanyCarClassId}
                disabled={listLoading || isError}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={listLoading ? 'Loading…' : 'Select Car Class'} />
                </SelectTrigger>
                <SelectContent>
                  {carClasses.filter(c => !!c.value).map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  {(!carClasses || carClasses.length === 0) && (
                    <SelectItem value="__NO_DATA__" disabled>No classes available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={listLoading} required />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={listLoading} required />
            </div>

            <div className="space-y-2">
              <Label>Extra KM Rate ($ / km)</Label>
              <NumberInput value={extraKmRate} onValue={setExtraKmRate} min={0} step="0.01" />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto h-[calc(92vh-140px-68px)] md:h-[calc(92vh-150px-72px)]">
          {isError && (
            <div className="text-destructive mb-4">
              {getErrMessage(error)}
            </div>
          )}

          <form id="edit-rate-form" className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Daily */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Daily</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Base Rate ($)</Label><NumberInput value={dailyBaseRate} onValue={setDailyBaseRate} min={0} step="0.01" /></div>
                <div className="space-y-2"><Label>Base KM</Label><NumberInput value={dailyBaseKm} onValue={setDailyBaseKm} min={0} /></div>
                <div className="space-y-2"><Label>Extra Hour ($)</Label><NumberInput value={dailyExtraHourRate} onValue={setDailyExtraHourRate} min={0} step="0.01" /></div>
                <div className="space-y-2"><Label>Extra Day ($)</Label><NumberInput value={dailyExtraDayRate} onValue={setDailyExtraDayRate} min={0} step="0.01" /></div>
              </div>

              <div className="rounded-lg border p-3 md:p-4 overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead><tr className="border-b">{['1st Day', '2nd Day', '3rd Day', '4th Day', '5th Day', '6th Day'].map((h) => (<th key={h} className="text-left p-2 whitespace-nowrap">{h}</th>))}</tr></thead>
                  <tbody>
                    <tr>
                      {(['first', 'second', 'third', 'fourth', 'fifth', 'sixth'] as const).map((key, idx) => (
                        <td key={key} className="p-2 align-top">
                          <div className="flex flex-col items-center gap-1">
                            <NumberInput value={dailyLOR[key]} onValue={(n) => setDailyLOR((p) => ({ ...p, [key]: n }))} step="0.01" className="w-28 text-center" />
                            <div className="text-xs text-muted-foreground">{fmt(dailyTotals[idx])}</div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weekly */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Weekly</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-2"><Label>Base Rate ($)</Label><NumberInput value={weeklyBaseRate} onValue={setWeeklyBaseRate} min={0} step="0.01" /></div>
                <div className="space-y-2"><Label>Base KM</Label><NumberInput value={weeklyBaseKm} onValue={setWeeklyBaseKm} min={0} /></div>
                <div className="space-y-2"><Label>Extra Day KM</Label><NumberInput value={weeklyExtraDayKm} onValue={setWeeklyExtraDayKm} min={0} /></div>
                <div className="space-y-2"><Label>Extra Hour ($)</Label><NumberInput value={weeklyExtraHourRate} onValue={setWeeklyExtraHourRate} min={0} step="0.01" /></div>
                <div className="space-y-2"><Label>Extra Day ($)</Label><NumberInput value={weeklyExtraDayRate} onValue={setWeeklyExtraDayRate} min={0} step="0.01" /></div>
              </div>

              <div className="rounded-lg border p-3 md:p-4 overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead><tr className="border-b">{['1st Week', '2nd Week', '3rd Week', '4th Week'].map((h) => (<th key={h} className="text-left p-2 whitespace-nowrap">{h}</th>))}</tr></thead>
                  <tbody>
                    <tr>
                      {(['first', 'second', 'third', 'fourth'] as const).map((key, idx) => (
                        <td key={key} className="p-2 align-top">
                          <div className="flex flex-col items-center gap-1">
                            <NumberInput value={weeklyLOR[key]} onValue={(n) => setWeeklyLOR((p) => ({ ...p, [key]: n }))} step="0.01" className="w-28 text-center" />
                            <div className="text-xs text-muted-foreground">{fmt(weeklyTotals[idx])}</div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Monthly</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-2"><Label>Base Rate ($)</Label><NumberInput value={monthlyBaseRate} onValue={setMonthlyBaseRate} min={0} step="0.01" /></div>
                <div className="space-y-2"><Label>Base KM</Label><NumberInput value={monthlyBaseKm} onValue={setMonthlyBaseKm} min={0} /></div>
                <div className="space-y-2"><Label>Extra Day KM</Label><NumberInput value={monthlyExtraDayKm} onValue={setMonthlyExtraDayKm} min={0} /></div>
                <div className="space-y-2"><Label>Extra Hour ($)</Label><NumberInput value={monthlyExtraHourRate} onValue={setMonthlyExtraHourRate} min={0} step="0.01" /></div>
                <div className="space-y-2"><Label>Extra Day ($)</Label><NumberInput value={monthlyExtraDayRate} onValue={setMonthlyExtraDayRate} min={0} step="0.01" /></div>
              </div>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogFooter className="px-6 py-4 gap-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              form="edit-rate-form"
              disabled={saving || listLoading || !companyCarClassId || !startDate || !endDate}
            >
              Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}