// src/components/Rates/NewRateDialog.tsx
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { RatePlan, NewRateDialogProps } from '@/types/rate';

const DEFAULT_RATE_PLAN: RatePlan[] = [
  { type: 'Daily', unl: true, base: 0, hour: 0, day: 0, periods: Array(6).fill(0) },
  { type: 'Weekly', unl: true, base: 0, hour: 0, day: 0, periods: Array(4).fill(0) },
  { type: 'Monthly', unl: true, base: 0, hour: 0, day: 0, periods: Array(1).fill(0) },
];

export default function NewRateDialog({ open, onClose, onAddRate, rateGroups, carClasses }: NewRateDialogProps) {
  const [rateGroup, setRateGroup] = React.useState('');
  const [carClass, setCarClass] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [plan, setPlan] = React.useState<RatePlan[]>(DEFAULT_RATE_PLAN);

  const canAdd = !!rateGroup && !!carClass && !!startDate && !!endDate;

  const handlePlanChange = (index: number, field: keyof RatePlan, value: number | boolean) => {
    setPlan(prev => 
      prev.map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const handlePeriodChange = (planIndex: number, periodIndex: number, value: number) => {
    setPlan(prev => 
      prev.map((row, i) => 
        i === planIndex
          ? { ...row, periods: row.periods.map((v, j) => (j === periodIndex ? value : v)) }
          : row
      )
    );
  };

  const resetForm = () => {
    setRateGroup('');
    setCarClass('');
    setStartDate('');
    setEndDate('');
    setPlan(DEFAULT_RATE_PLAN);
  };

  const handleAdd = () => {
    onAddRate({
      rateGroup,
      carClass,
      startDate,
      endDate,
      daily: plan[0],
      weekly: plan[1],
      monthly: plan[2],
    });
    resetForm();
  };

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>New Rate</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canAdd) handleAdd();
          }}
        >
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Rate Group *</Label>
              <Select value={rateGroup} onValueChange={setRateGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Rate Group" />
                </SelectTrigger>
                <SelectContent>
                  {rateGroups.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Car Class *</Label>
              <Select value={carClass} onValueChange={setCarClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Car Class" />
                </SelectTrigger>
                <SelectContent>
                  {carClasses.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pr-8"
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pr-8"
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Rate Adjustments</h3>
            <div className="rounded-lg border p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rate Plan Type</th>
                    <th className="text-left p-2">UNL?</th>
                    <th className="text-left p-2">Base Rate ($)</th>
                    <th className="text-left p-2">Extra Hour ($)</th>
                    <th className="text-left p-2">Extra Day ($)</th>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <th key={n} className="text-left p-2">{n}st</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.map((row, i) => (
                    <tr key={row.type} className="border-b">
                      <td className="p-2 font-medium">{row.type}</td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={row.unl}
                          onChange={(e) => handlePlanChange(i, 'unl', e.target.checked)}
                          className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={row.base}
                          onChange={(e) => handlePlanChange(i, 'base', Number(e.target.value))}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={row.hour}
                          onChange={(e) => handlePlanChange(i, 'hour', Number(e.target.value))}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={row.day}
                          onChange={(e) => handlePlanChange(i, 'day', Number(e.target.value))}
                          className="w-24"
                        />
                      </td>
                      {row.periods.map((period, j) => (
                        <td key={j} className="p-2">
                          <Input
                            type="number"
                            value={period}
                            onChange={(e) => handlePeriodChange(i, j, Number(e.target.value))}
                            className="w-20"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canAdd}>
              Add Rate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}