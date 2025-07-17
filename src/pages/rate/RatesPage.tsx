import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, RefreshCw, Layers, Car, Calendar, BadgeDollarSign } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import NewRateDialog from '@/components/Rates/NewRateDialog';
import { Rate, RateGroup, CarClass, NewRateData } from '@/types/rate';

const MOCK_RATE_GROUPS: RateGroup[] = [
  { label: 'STAN', value: 'STAN' },
  { label: 'ALL', value: 'ALL' },
];

const MOCK_CAR_CLASSES: CarClass[] = [
  { label: 'MCAR', value: 'MCAR' },
  { label: 'ECON', value: 'ECON' },
];

const INITIAL_MOCK_RATES: Rate[] = [
  {
    id: 1,
    group: 'STAN',
    car: 'MCAR',
    begin: '06/05/2025',
    end: '07/20/2025',
    blackouts: '',
    daily: 12,
    weekend: 108,
    weekly: 0,
    monthly: 0,
    lastMod: 'Today 12:57 AM by marietta@pricelesscarrental.com',
  },
  {
    id: 2,
    group: 'STAN',
    car: 'MCAR',
    begin: '07/21/2025',
    end: '08/09/2025',
    blackouts: '',
    daily: 12,
    weekend: 108,
    weekly: 0,
    monthly: 0,
    lastMod: 'Today 12:57 AM by marietta@pricelesscarrental.com',
  },
];

export default function RatesPage() {
  const [rates, setRates] = React.useState<Rate[]>(INITIAL_MOCK_RATES);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [filterGroup, setFilterGroup] = React.useState('ALL');
  const [filterCarClass, setFilterCarClass] = React.useState('MCAR');

  const filteredRates = rates.filter(
    (r) =>
      (filterGroup === 'ALL' || r.group === filterGroup) &&
      (filterCarClass === '' || r.car === filterCarClass)
  );

  const handleAddRate = (newRate: NewRateData) => {
    setRates((rates) => [
      ...rates,
      {
        id: rates.length + 1,
        group: newRate.rateGroup,
        car: newRate.carClass,
        begin: newRate.startDate,
        end: newRate.endDate,
        blackouts: '',
        daily: Number(newRate.daily.base),
        weekend: Number(newRate.weekly.base),
        weekly: Number(newRate.weekly.base),
        monthly: Number(newRate.monthly.base),
        lastMod: 'Now by you@demo.com',
      },
    ]);
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setRates((rates) => rates.filter((r) => r.id !== id));
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
            Manage rates for every group, class, and rental period. Click "New Rate" to add, filter by class or group, and keep your pricing sharp.
          </p>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            onClick={() => setDialogOpen(true)}
            className="gap-2 rounded-xl shadow-md"
            variant="default"
          >
            <Plus className="h-5 w-5" />
            New Rate
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="h-5 w-5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6 bg-muted/60 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Layers className="w-4 h-4" /> Rate Group
          </Label>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-36 rounded-lg shadow">
              <SelectValue placeholder="All Rate Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {MOCK_RATE_GROUPS.filter((g) => g.value !== 'ALL').map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Car className="w-4 h-4" /> Car Class
          </Label>
          <Select value={filterCarClass} onValueChange={setFilterCarClass}>
            <SelectTrigger className="w-36 rounded-lg shadow">
              <SelectValue placeholder="Car Class" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CAR_CLASSES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
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
              <TableHead className="text-right">Weekend</TableHead>
              <TableHead className="text-right">Weekly</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead>Last Modification</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRates.map((rate, idx) => (
              <TableRow
                key={rate.id}
                className={idx % 2 === 0 ? "bg-muted/30" : ""}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/20"
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
                  <span className="text-muted-foreground italic">
                    {rate.blackouts || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${rate.daily.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${rate.weekend.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${rate.weekly.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${rate.monthly.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{rate.lastMod}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => handleDelete(rate.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredRates.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  No rates found. Try changing your filters or add a new rate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Rate Dialog */}
      <NewRateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAddRate={handleAddRate}
        rateGroups={MOCK_RATE_GROUPS}
        carClasses={MOCK_CAR_CLASSES}
      />
    </div>
  );
}
