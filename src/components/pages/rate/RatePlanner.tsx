'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, LineChart } from 'lucide-react';

// ---------- MOCK DATA ----------
const DURATION_HEADERS = [
  { key: '1', label: '1 DAY' },
  { key: '2', label: '2 DAYS' },
  { key: '3', label: '3 DAYS' },
  { key: '4', label: '4 DAYS' },
  { key: '5', label: '5 DAYS' },
  { key: '6', label: '6 DAYS' },
  { key: '7', label: '7 DAYS' },
  { key: '14', label: '14 DAYS' },
  { key: '21', label: '21 DAYS' },
  { key: '28', label: '28 DAYS' },
];

const MOCK_ROWS = Array.from({ length: 7 }, (_, i) => ({
  date: `07/${17 + i}`,
  values: [12.6, 25.2, 37.8, 50.4, 63, 75.6, 113.4, 226.8, null, null],
}));

// ---------- TYPE FIXES ----------
interface PriceChangeDialogProps {
  open: boolean;
  onClose: () => void;
  value?: number;
  days?: number;
}

interface LengthOfRentalDialogProps {
  open: boolean;
  onClose: () => void;
  duration?: string;
  isDay?: boolean;
}

// ---------- DIALOG COMPONENTS ----------

function PriceChangeDialog({
  open,
  onClose,
  value = 12,
  days = 3,
}: PriceChangeDialogProps) {
  const net = value * days;
  const vat = net * 0.05;
  const total = net + vat;
  const fee = 1.8;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background/90 text-foreground shadow-2xl rounded-2xl border border-primary/10 animate-in fade-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-primary" /> Price Change
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 px-1 space-y-1">
          <div className="text-sm flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" /> Pickup: <b>July 18, 2025</b>
          </div>
          <div className="text-sm flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" /> Return: <b>July 21, 2025</b>
          </div>
          <div className="text-sm mb-3 flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" /> <b>{days} Days</b>
          </div>
          <hr className="my-2 border-muted-foreground/30" />
          <div className="flex justify-between text-sm">
            <span>Daily:</span>
            <span>
              {days} x ${value.toFixed(2)} =
            </span>
            <span className="ml-2 font-bold text-primary">
              ${net.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Net Price:</span>
            <span></span>
            <span>${net.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT (5%):</span>
            <span></span>
            <span>${vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Price:</span>
            <span></span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Fees:</span>
            <span></span>
            <span>${fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>Fee Percentage:</span>
            <span></span>
            <span>4.762%</span>
          </div>
          <div className="mt-3">
            <RadioGroup defaultValue="set" className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <RadioGroupItem value="set" />
                Set Amount To:
                <Input className="ml-2 w-24" defaultValue={value} />
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="change" />
                Change Amount By:
                <Input className="ml-2 w-24" />
              </label>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-primary" disabled>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LengthOfRentalDialog({
  open,
  onClose,
  duration = '07/17',
  isDay = false,
}: LengthOfRentalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background/90 text-foreground rounded-2xl border border-primary/10 shadow-xl animate-in fade-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-primary" /> Length of Rental Rate
            Entry
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 px-1">
          <div className="text-center text-lg mb-4 font-semibold text-primary/90">
            {isDay ? `${duration} Day` : duration}
          </div>
          {isDay ? (
            <RadioGroup defaultValue="set" className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <RadioGroupItem value="set" />
                Set Amount To:
                <Input className="ml-2 w-24" />
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="change" />
                Change Amount By:
                <Input className="ml-2 w-24" />
              </label>
            </RadioGroup>
          ) : (
            <div className="flex items-center gap-2">
              <span>Change Amount By:</span>
              <Input className="w-24" />
              <Select defaultValue="fixed">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Fixed Amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-primary" disabled>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- MAIN RATE PLANNER PAGE ----------

export default function RatePlannerPage() {
  const [priceDialog, setPriceDialog] = React.useState<{
    open: boolean;
    value: number;
    days: number;
  }>({ open: false, value: 0, days: 1 });
  const [lengthDialog, setLengthDialog] = React.useState<{
    open: boolean;
    label: string;
    isDay: boolean;
  }>({ open: false, label: '', isDay: false });

  return (
    <TooltipProvider>
      <div className="relative max-w-7xl mx-auto  bg-background/90">
        {/* Header & CTA */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <LineChart className="w-7 h-7 text-primary animate-pulse" />
              Rate Planner
            </h2>
            <p className="text-muted-foreground text-base">
              Plan, adjust, and optimize your rental rates in one view.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <Select defaultValue="MCAR">
            <SelectTrigger className="w-32 rounded-lg shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCAR">MCAR</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="STAN">
            <SelectTrigger className="w-32 rounded-lg shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAN">STAN</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-36 rounded-lg shadow-sm"
            defaultValue="2025-07-17"
          />
          <Input
            type="time"
            className="w-28 rounded-lg shadow-sm"
            defaultValue="21:00"
          />
          <Select defaultValue="No Source">
            <SelectTrigger className="w-36 rounded-lg shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="No Source">No Source</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-lg shadow-sm">
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl shadow-inner border bg-card/60">
          <table className="w-full border-collapse text-center">
            <thead className="sticky top-0 bg-background/90 z-10 shadow">
              <tr>
                <th className="px-4 py-3 border-b font-semibold bg-muted/60">
                  Pickup
                </th>
                {DURATION_HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className="px-4 py-3 border-b font-semibold bg-muted/60 cursor-pointer hover:bg-primary/20 transition"
                    onClick={() =>
                      setLengthDialog({
                        open: true,
                        label: h.label,
                        isDay: true,
                      })
                    }
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ROWS.map((row, idx) => (
                <tr
                  key={row.date}
                  className={idx % 2 === 0 ? 'bg-muted/20' : ''}
                >
                  <td
                    className="border px-2 py-2 font-semibold cursor-pointer hover:bg-primary transition"
                    onClick={() =>
                      setLengthDialog({
                        open: true,
                        label: row.date,
                        isDay: false,
                      })
                    }
                  >
                    {row.date}
                  </td>
                  {row.values.map((val, j) => (
                    <td
                      key={j}
                      className={`border px-4 py-2 text-lg cursor-pointer transition-all rounded ${
                        val === null
                          ? 'bg-destructive/90 text-destructive-foreground font-medium'
                          : 'hover:bg-primary/20'
                      }`}
                      onClick={() =>
                        val !== null &&
                        setPriceDialog({ open: true, value: val, days: j + 1 })
                      }
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {val === null ? (
                              <span className="opacity-40">—</span>
                            ) : (
                              `$${val.toFixed(2)}`
                            )}
                          </span>
                        </TooltipTrigger>
                        {val !== null && (
                          <TooltipContent className="bg-muted text-foreground border border-muted">
                            <div>
                              Click to edit price for <b>{row.date}</b>,{' '}
                              <b>{DURATION_HEADERS[j]?.label}</b>
                            </div>
                            <div className="font-semibold">
                              Value: ${val.toFixed(2)}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground p-2 text-right">
            Click any cell to edit rates.{' '}
            <span className="ml-4">
              Empty slots:{' '}
              <span className="text-destructive font-semibold">—</span>
            </span>
          </div>
        </div>
      </div>

      {/* All Modals */}
      <PriceChangeDialog
        open={priceDialog.open}
        onClose={() => setPriceDialog({ ...priceDialog, open: false })}
        value={priceDialog.value}
        days={priceDialog.days}
      />
      <LengthOfRentalDialog
        open={lengthDialog.open}
        onClose={() => setLengthDialog({ ...lengthDialog, open: false })}
        duration={lengthDialog.label}
        isDay={lengthDialog.isDay}
      />
    </TooltipProvider>
  );
}
