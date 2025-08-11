// src/components/Rates/NewRateDialog.tsx

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

type CarClassOption = { value: string; label: string };

export type NewRateDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddRate: (payload: any) => void; // shaped as backend expects
  carClasses: CarClassOption[];      // value = companyCarClassId (non-empty!)
};

type DailyLOR = {
  first: number; second: number; third: number; fourth: number; fifth: number; sixth: number;
};
type WeeklyLOR = {
  first: number; second: number; third: number; fourth: number;
};

const DEFAULT_DAILY_LOR: DailyLOR = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0, sixth: 0 };
const DEFAULT_WEEKLY_LOR: WeeklyLOR = { first: 0, second: 0, third: 0, fourth: 0 };


const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = (n: number) => currency.format(Number.isFinite(n) ? n : 0);

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
          onValue(0);
          return;
        }
        const n = Number(v);
        onValue(Number.isFinite(n) ? n : 0);
      }}
      onBlur={() => {
        setFocused(false);
        if (text === '' || text === '-' || text === '.' || text === '-.') {
          setText('0');
          onValue(0);
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

export default function NewRateDialog({ open, onClose, onAddRate, carClasses }: NewRateDialogProps) {
  // top-level
  const [companyCarClassId, setCompanyCarClassId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [extraKmRate, setExtraKmRate] = React.useState<number>(0);

  // daily
  const [dailyBaseRate, setDailyBaseRate] = React.useState<number>(0);
  const [dailyBaseKm, setDailyBaseKm] = React.useState<number>(0);
  const [dailyExtraHourRate, setDailyExtraHourRate] = React.useState<number>(0);
  const [dailyExtraDayRate, setDailyExtraDayRate] = React.useState<number>(0);
  const [dailyLOR, setDailyLOR] = React.useState<DailyLOR>({ ...DEFAULT_DAILY_LOR });

  // weekly
  const [weeklyBaseRate, setWeeklyBaseRate] = React.useState<number>(0);
  const [weeklyBaseKm, setWeeklyBaseKm] = React.useState<number>(0);
  const [weeklyExtraDayKm, setWeeklyExtraDayKm] = React.useState<number>(0);
  const [weeklyExtraHourRate, setWeeklyExtraHourRate] = React.useState<number>(0);
  const [weeklyExtraDayRate, setWeeklyExtraDayRate] = React.useState<number>(0);
  const [weeklyLOR, setWeeklyLOR] = React.useState<WeeklyLOR>({ ...DEFAULT_WEEKLY_LOR });

  // monthly
  const [monthlyBaseRate, setMonthlyBaseRate] = React.useState<number>(0);
  const [monthlyBaseKm, setMonthlyBaseKm] = React.useState<number>(0);
  const [monthlyExtraDayKm, setMonthlyExtraDayKm] = React.useState<number>(0);
  const [monthlyExtraHourRate, setMonthlyExtraHourRate] = React.useState<number>(0);
  const [monthlyExtraDayRate, setMonthlyExtraDayRate] = React.useState<number>(0);


  const resetForm = () => {
    setCompanyCarClassId('');
    setStartDate('');
    setEndDate('');
    setExtraKmRate(0);

    setDailyBaseRate(0);
    setDailyBaseKm(0);
    setDailyExtraHourRate(0);
    setDailyExtraDayRate(0);
    setDailyLOR({ ...DEFAULT_DAILY_LOR });

    setWeeklyBaseRate(0);
    setWeeklyBaseKm(0);
    setWeeklyExtraDayKm(0);
    setWeeklyExtraHourRate(0);
    setWeeklyExtraDayRate(0);
    setWeeklyLOR({ ...DEFAULT_WEEKLY_LOR });

    setMonthlyBaseRate(0);
    setMonthlyBaseKm(0);
    setMonthlyExtraDayKm(0);
    setMonthlyExtraHourRate(0);
    setMonthlyExtraDayRate(0);
  };

  React.useEffect(() => { if (!open) resetForm(); }, [open]);

  const toApiDate = (yyyyMmDd: string) => {
    if (!yyyyMmDd) return '';
    const [y, m, d] = yyyyMmDd.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleAdd = () => {
    const payload = {
      companyCarClassId,
      startDateTime: toApiDate(startDate),
      endDateTime: toApiDate(endDate),

      extraKmRate,

      dailyBaseRate,
      dailyBaseKm,
      dailyExtraHourRate,
      dailyExtraDayRate,
      dailyLORAdjustments: { ...dailyLOR },

      weeklyBaseRate,
      weeklyBaseKm,
      weeklyExtraDayKm,
      weeklyExtraHourRate,
      weeklyExtraDayRate,
      weeklyLORAdjustments: { ...weeklyLOR },

      monthlyBaseRate,
      monthlyBaseKm,
      monthlyExtraDayKm,
      monthlyExtraHourRate,
      monthlyExtraDayRate,
    };

    onAddRate(payload);
    resetForm();
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

  const DailyHeaders = ['1st Day', '2nd Day', '3rd Day', '4th Day', '5th Day', '6th Day'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] md:max-w-3xl lg:max-w-5xl p-0 h-[92vh]">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogHeader className="px-6 pt-4 pb-3">
            <DialogTitle className="text-xl md:text-2xl">New Rate</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-4">
            <div className="space-y-2">
              <Label>Car Class *</Label>
              <Select value={companyCarClassId} onValueChange={setCompanyCarClassId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Car Class" />
                </SelectTrigger>
                <SelectContent>
                  {carClasses.filter(c => !!c.value).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                  {carClasses.length === 0 && (
                    <SelectItem value="__NO_DATA__" disabled>No classes available</SelectItem>
                  )}
                </SelectContent>
              </Select>

            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Extra KM Rate ($ / km)</Label>
              <NumberInput value={extraKmRate} onValue={setExtraKmRate} min={0} step="0.01" />
            </div>
          </div>
          <div className="px-6 py-5 overflow-y-auto h-[calc(92vh-140px-68px)] md:h-[calc(92vh-150px-72px)]">
            <form id="rate-form" className="space-y-8" onSubmit={(e) => { e.preventDefault(); if (companyCarClassId && startDate && endDate) handleAdd(); }}>
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
                    <thead><tr className="border-b">{DailyHeaders.map((h) => (<th key={h} className="text-left p-2 whitespace-nowrap">{h}</th>))}</tr></thead>
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
          <DialogFooter className="px-6 py-4 gap-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="rate-form" disabled={!(companyCarClassId && startDate && endDate)}>Add Rate</Button>
          </DialogFooter>
        </div>



      </DialogContent>
    </Dialog>
  );
}
