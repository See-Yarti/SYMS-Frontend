'use client';

// src/components/Blackout/BlackoutDialog.tsx

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { parseISO, format } from 'date-fns';
import { useFetchData } from '@/hooks/useOperatorCarClass';
import { useGetActiveLocations } from '@/hooks/useLocationApi';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== Types =====
interface CarClass {
  id: string;
  slug: string;
  name: string;
}
interface Location {
  id: string;
  city: string;
  title?: string;
  isAirportZone?: boolean;
}
interface Blackout {
  id: string;
  description: string;
  type: 'FULL' | 'PICKUP_ONLY' | 'RETURN_ONLY';
  startDateTime: string;
  endDateTime: string;
  carClasses: { id: string; carClass: CarClass }[];
  locations: Location[];
  isActive: boolean;
}
interface BlackoutDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    description: string;
    type: 'FULL' | 'PICKUP_ONLY' | 'RETURN_ONLY';
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    carClassIds: string[];
    locationIds: string[];
  }) => Promise<void> | void;
  blackout?: Blackout;
  companyId: string;
  initialLocationId?: string;
}
interface CarClassGroupItem {
  carClassId: string; // Base car class ID (e.g., "031a2407...")
  slug: string; // "MCAR"
  label: string; // "MCAR — Available at 2 locations"
  companyCarClassIds: string[]; // All companyCarClassIds for this car class across selected locations
  selected: boolean;
}

// ===== New API shapes (multi-location) =====
type CCCPerLocation = {
  locationId: string;
  companyCarClassId: string;
  isAvailable: boolean;
  make?: string;
  model?: string;
  numberOfBags?: number;
  numberOfDoors?: number;
  numberOfPassengers?: number;
};
type CCCGroup = {
  carClass: CarClass;
  anyAvailable: boolean;
  allAvailable: boolean;
  locations: CCCPerLocation[];
};
type MultiLocationCCCResponse = {
  success: true;
  data: {
    success: true;
    data: CCCGroup[];
    timestamp: string;
  };
  timestamp: string;
};

// ===== Helpers =====
const pad2 = (n: number) => String(n).padStart(2, '0');
const useTodayIso = () =>
  React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }, []);
const nowRoundedToMinute = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const toApiDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const toApiTime = (hhmm: string) => {
  if (!hhmm) return '';
  const [h24, m] = hhmm.split(':').map(Number);
  const ampm = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 || 12;
  return `${pad2(h12)}.${pad2(m)} ${ampm}`;
};
const prettyLocationLabel = (loc?: Location) =>
  !loc
    ? 'Unknown Location'
    : `PR: ${loc.title || loc.city}${loc.isAirportZone ? ' Airport' : ''}`;
const arraysShallowEqual = <T,>(a: T[], b: T[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export default function BlackoutDialog({
  open,
  onClose,
  onSave,
  blackout,
  companyId,
  initialLocationId,
}: BlackoutDialogProps) {
  // Form
  const [description, setDescription] = React.useState('');
  const [blackoutType, setBlackoutType] = React.useState<
    'FULL' | 'PICKUP_ONLY' | 'RETURN_ONLY'
  >('FULL');
  const [startDate, setStartDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('00:00');
  const [endDate, setEndDate] = React.useState('');
  const [endTime, setEndTime] = React.useState('23:59');
  const [selectedLocationIds, setSelectedLocationIds] = React.useState<
    string[]
  >([]);
  const [availableCCCs, setAvailableCCCs] = React.useState<CarClassGroupItem[]>(
    [],
  );
  const [selectedCCCs, setSelectedCCCs] = React.useState<CarClassGroupItem[]>(
    [],
  );
  const [pendingSelectedCCCIds, setPendingSelectedCCCIds] = React.useState<
    string[] | null
  >(null);

  // Locations list
  const {
    data: activeLocationsResp,
    isLoading: isLocLoading,
    isError: isLocError,
  } = useGetActiveLocations(companyId);
  const activeLocations: Location[] = React.useMemo(
    () =>
      Array.isArray(activeLocationsResp?.data) ? activeLocationsResp!.data : [],
    [activeLocationsResp],
  );

  // Build stable, sorted key for multi-location endpoint
  const locKey = React.useMemo(
    () => selectedLocationIds.slice().sort().join(','),
    [selectedLocationIds],
  );

  // 👉 Fetch NEW multi-location CCC endpoint
  const { data: rawResp } = useFetchData<MultiLocationCCCResponse>(
    selectedLocationIds.length > 0
      ? `company-car-class/${companyId}/locations/${encodeURIComponent(locKey)}`
      : '',
    ['company-car-class', companyId, locKey],
    { enabled: selectedLocationIds.length > 0 },
  );

  // Group car classes - only show car classes available at ALL selected locations
  const flatCCCItems = React.useMemo<CarClassGroupItem[]>(() => {
    const payload = Array.isArray((rawResp as any)?.data?.data)
      ? (rawResp as any).data.data
      : Array.isArray((rawResp as any)?.data)
        ? (rawResp as any).data
        : Array.isArray(rawResp)
          ? (rawResp as any)
          : [];

    if (
      !Array.isArray(payload) ||
      payload.length === 0 ||
      selectedLocationIds.length === 0
    )
      return [];

    const selectedSet = new Set(selectedLocationIds);
    const items: CarClassGroupItem[] = [];

    for (const group of payload) {
      const carClass = group?.carClass;
      if (!carClass) continue;

      const slug = carClass.slug || carClass.name || 'Class';
      const locs: CCCPerLocation[] = group?.locations || [];

      // Filter locations to only include selected ones
      const matchingLocs = locs.filter((loc) =>
        selectedSet.has(loc.locationId),
      );

      // Only include this car class if it's available at ALL selected locations
      if (matchingLocs.length !== selectedLocationIds.length) continue;

      // Collect all companyCarClassIds for this car class across selected locations
      const companyCarClassIds = matchingLocs.map(
        (loc) => loc.companyCarClassId,
      );

      // Build label showing availability
      const makeModels = matchingLocs
        .map((loc) => (loc.make && loc.model ? `${loc.make} ${loc.model}` : ''))
        .filter(Boolean);
      const uniqueMakeModels = [...new Set(makeModels)];

      const label =
        selectedLocationIds.length > 1
          ? `${slug} — Available at ${selectedLocationIds.length} location${selectedLocationIds.length > 1 ? 's' : ''}`
          : `${slug}${uniqueMakeModels.length > 0 ? ` — ${uniqueMakeModels[0]}` : ''}`;

      items.push({
        carClassId: carClass.id,
        slug,
        label,
        companyCarClassIds,
        selected: false,
      });
    }

    return items;
  }, [rawResp, selectedLocationIds]);

  // Hydrate on open / edit
  React.useEffect(() => {
    if (!open) return;

    if (blackout && blackout.id) {
      setDescription(blackout.description ?? '');
      setBlackoutType(blackout.type ?? 'FULL');
      try {
        setStartDate(
          blackout.startDateTime
            ? format(parseISO(blackout.startDateTime), 'yyyy-MM-dd')
            : '',
        );
        setStartTime(
          blackout.startDateTime
            ? format(parseISO(blackout.startDateTime), 'HH:mm')
            : '00:00',
        );
      } catch {
        setStartDate('');
        setStartTime('00:00');
      }
      try {
        setEndDate(
          blackout.endDateTime
            ? format(parseISO(blackout.endDateTime), 'yyyy-MM-dd')
            : '',
        );
        setEndTime(
          blackout.endDateTime
            ? format(parseISO(blackout.endDateTime), 'HH:mm')
            : '23:59',
        );
      } catch {
        setEndDate('');
        setEndTime('23:59');
      }

      const locs = Array.isArray(blackout.locations)
        ? blackout.locations.map((l) => l.id)
        : [];
      setSelectedLocationIds(locs);

      const preIds = Array.isArray(blackout.carClasses)
        ? blackout.carClasses.map((cc) => cc.id).filter(Boolean)
        : [];
      setPendingSelectedCCCIds(preIds);
    } else {
      setDescription('');
      setBlackoutType('FULL');
      setStartDate('');
      setStartTime('00:00');
      setEndDate('');
      setEndTime('23:59');
      setSelectedLocationIds(initialLocationId ? [initialLocationId] : []);
      setPendingSelectedCCCIds([]);
      setSelectedCCCs([]);
      setAvailableCCCs([]);
    }
  }, [open, blackout?.id, initialLocationId, blackout]);

  // Build transfer lists whenever flat items change
  React.useEffect(() => {
    if (flatCCCItems.length === 0) {
      setAvailableCCCs([]);
      setSelectedCCCs([]); // reset when nothing available for chosen locations
      return;
    }

    // Apply pending preselect once (edit mode)
    if (pendingSelectedCCCIds && pendingSelectedCCCIds.length > 0) {
      const pre = new Set(pendingSelectedCCCIds);

      // Check which car class groups have at least one matching companyCarClassId
      const selected = flatCCCItems
        .filter((group) => group.companyCarClassIds.some((id) => pre.has(id)))
        .map((x) => ({ ...x, selected: false }));

      const selectedIds = new Set(selected.map((s) => s.carClassId));
      const available = flatCCCItems.filter(
        (x) => !selectedIds.has(x.carClassId),
      );

      setSelectedCCCs(selected);
      setAvailableCCCs(available);
      setPendingSelectedCCCIds(null);
      return;
    }

    // Reconcile with user's existing selection when locations change
    setSelectedCCCs((prevSelected) => {
      const allowedCarClassIds = new Set(flatCCCItems.map((i) => i.carClassId));
      const stillSelected = prevSelected.filter((s) =>
        allowedCarClassIds.has(s.carClassId),
      );
      const stillIds = new Set(stillSelected.map((s) => s.carClassId));
      const computedSelected = flatCCCItems
        .filter((i) => stillIds.has(i.carClassId))
        .map((i) => ({ ...i, selected: false }));
      const computedAvailable = flatCCCItems.filter(
        (i) => !stillIds.has(i.carClassId),
      );

      // Update available in sync
      setAvailableCCCs(computedAvailable);

      // Only update selected if IDs actually changed
      if (
        arraysShallowEqual(
          computedSelected.map((s) => s.carClassId),
          prevSelected.map((s) => s.carClassId),
        )
      ) {
        return prevSelected;
      }
      return computedSelected;
    });
  }, [flatCCCItems, pendingSelectedCCCIds]);

  // Date constraints
  const todayMin = useTodayIso();
  const nowMinIfToday = startDate === todayMin ? nowRoundedToMinute() : '00:00';
  React.useEffect(() => {
    if (startDate && startDate < todayMin) setStartDate(todayMin);
  }, [startDate, todayMin]);
  React.useEffect(() => {
    if (startDate === todayMin && startTime < nowMinIfToday)
      setStartTime(nowMinIfToday);
  }, [startDate, startTime, nowMinIfToday, todayMin]);
  const endDateMinIso = startDate
    ? startDate > todayMin
      ? startDate
      : todayMin
    : todayMin;
  React.useEffect(() => {
    if (endDate && endDate < endDateMinIso) setEndDate(endDateMinIso);
  }, [endDate, endDateMinIso]);
  React.useEffect(() => {
    if (endDate === startDate && endTime < startTime) setEndTime(startTime);
  }, [endTime, endDate, startDate, startTime]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocationIds =
      selectedLocationIds.length === 0 && initialLocationId
        ? [initialLocationId]
        : selectedLocationIds;

    // Flatten all companyCarClassIds from selected car class groups
    const allCompanyCarClassIds = selectedCCCs.flatMap(
      (group) => group.companyCarClassIds,
    );

    await onSave({
      description,
      type: blackoutType,
      startDate: toApiDate(startDate),
      startTime: toApiTime(startTime),
      endDate: toApiDate(endDate),
      endTime: toApiTime(endTime),
      carClassIds: allCompanyCarClassIds, // All companyCarClassIds across all locations
      locationIds: finalLocationIds,
    });
  };

  // Transfer helpers
  const toggleSelected = (
    list: CarClassGroupItem[],
    idx: number,
    setList: React.Dispatch<React.SetStateAction<CarClassGroupItem[]>>,
  ) =>
    setList(
      list.map((x, i) => (i === idx ? { ...x, selected: !x.selected } : x)),
    );

  const moveSelected = (
    from: CarClassGroupItem[],
    to: CarClassGroupItem[],
    setFrom: React.Dispatch<React.SetStateAction<CarClassGroupItem[]>>,
    setTo: React.Dispatch<React.SetStateAction<CarClassGroupItem[]>>,
  ) => {
    const toMove = from.filter((x) => x.selected);
    setFrom(from.filter((x) => !x.selected));
    setTo([...to, ...toMove.map((x) => ({ ...x, selected: false }))]);
  };

  const moveAll = (
    from: CarClassGroupItem[],
    setFrom: React.Dispatch<React.SetStateAction<CarClassGroupItem[]>>,
    to: CarClassGroupItem[],
    setTo: React.Dispatch<React.SetStateAction<CarClassGroupItem[]>>,
  ) => {
    setTo([...to, ...from.map((x) => ({ ...x, selected: false }))]);
    setFrom([]);
  };

  // Locations UI
  const [locOpen, setLocOpen] = React.useState(false);
  const allSelectedLabel =
    selectedLocationIds.length > 0
      ? selectedLocationIds
          .map((id) =>
            prettyLocationLabel(activeLocations.find((l) => l.id === id)),
          )
          .join(', ')
      : '';

  const toggleLocation = (id: string) =>
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const clearLocation = (id: string) =>
    setSelectedLocationIds((prev) => prev.filter((x) => x !== id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl bg-background/95 text-foreground rounded-2xl border shadow-xl"
        aria-describedby="blackout-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {blackout ? 'Update' : 'Create'} Blackout
          </DialogTitle>
          <DialogDescription id="blackout-dialog-desc">
            Configure blackout type, locations, company car classes, and the
            time window. Fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Description + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="description" className="text-sm font-medium mb-1">
                Description *
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">
                Blackout Type *
              </label>
              <Select
                value={blackoutType}
                onValueChange={(v: 'FULL' | 'PICKUP_ONLY' | 'RETURN_ONLY') =>
                  setBlackoutType(v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Full</SelectItem>
                  <SelectItem value="PICKUP_ONLY">Pickup Only</SelectItem>
                  <SelectItem value="RETURN_ONLY">Return Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Location(s)= *</label>
              <Popover open={locOpen} onOpenChange={setLocOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={locOpen}
                    className="w-full justify-between"
                    disabled={isLocLoading || isLocError}
                  >
                    <span className="truncate">
                      {isLocLoading
                        ? 'Loading locations...'
                        : isLocError
                          ? 'Failed to load locations'
                          : selectedLocationIds.length > 0
                            ? allSelectedLabel
                            : initialLocationId
                              ? prettyLocationLabel(
                                  activeLocations.find(
                                    (l) => l.id === initialLocationId,
                                  ),
                                ) || 'Select Location(s)'
                              : 'Select Location(s)'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <div className="px-3 py-2 text-sm font-medium">
                      Select Location(s)
                    </div>
                    <CommandInput placeholder="Search" />
                    <CommandList className="max-h-64">
                      <CommandEmpty>
                        {activeLocations.length === 0
                          ? 'No active locations'
                          : 'No match'}
                      </CommandEmpty>
                      <CommandGroup>
                        {activeLocations.map((loc) => {
                          const checked = selectedLocationIds.includes(loc.id);
                          return (
                            <CommandItem
                              key={loc.id}
                              value={loc.city}
                              onSelect={() => toggleLocation(loc.id)}
                              className="flex items-center gap-2"
                            >
                              <span
                                className={cn(
                                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                                  checked
                                    ? 'bg-[#F56304] text-white'
                                    : 'bg-background',
                                )}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              <span className="truncate">
                                {prettyLocationLabel(loc)}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected chips */}
              <div className="flex flex-wrap gap-2 mt-2">
                {(selectedLocationIds.length > 0
                  ? selectedLocationIds
                  : initialLocationId
                    ? [initialLocationId]
                    : []
                ).map((id) => {
                  const loc = activeLocations.find((l) => l.id === id);
                  const label = prettyLocationLabel(loc);
                  const canRemove =
                    selectedLocationIds.length > 0 ||
                    (initialLocationId && id !== initialLocationId);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-md"
                    >
                      <span className="text-sm text-[#F56304]">{label}</span>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => clearLocation(id)}
                          className="text-destructive hover:text-destructive/80"
                          aria-label="Remove location"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Company Car Classes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Car Classes</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 border rounded-md p-2 max-h-60 overflow-y-auto">
                <div className="text-xs font-medium mb-2">
                  Available ({availableCCCs.filter((c) => c.selected).length}{' '}
                  selected)
                </div>
                {availableCCCs.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No entries
                  </div>
                ) : (
                  availableCCCs.map((item, index) => (
                    <div
                      key={item.carClassId}
                      className="flex items-center gap-2 p-1"
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() =>
                          toggleSelected(availableCCCs, index, setAvailableCCCs)
                        }
                        className="data-[state=checked]:bg-[#F56304] data-[state=checked]:border-[#F56304]"
                      />
                      <span>{item.label}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex md:flex-col justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    moveSelected(
                      availableCCCs,
                      selectedCCCs,
                      setAvailableCCCs,
                      setSelectedCCCs,
                    )
                  }
                >
                  &gt;
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    moveAll(
                      availableCCCs,
                      setAvailableCCCs,
                      selectedCCCs,
                      setSelectedCCCs,
                    )
                  }
                >
                  &gt;&gt;
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    moveSelected(
                      selectedCCCs,
                      availableCCCs,
                      setSelectedCCCs,
                      setAvailableCCCs,
                    )
                  }
                >
                  &lt;
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    moveAll(
                      selectedCCCs,
                      setSelectedCCCs,
                      availableCCCs,
                      setAvailableCCCs,
                    )
                  }
                >
                  &lt;&lt;
                </Button>
              </div>

              <div className="flex-1 border rounded-md p-2 max-h-60 overflow-y-auto">
                <div className="text-xs font-medium mb-2">
                  Selected ({selectedCCCs.filter((c) => c.selected).length}{' '}
                  selected)
                </div>
                {selectedCCCs.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No entries selected
                  </div>
                ) : (
                  selectedCCCs.map((item, index) => (
                    <div
                      key={item.carClassId}
                      className="flex items-center gap-2 p-1"
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() =>
                          toggleSelected(selectedCCCs, index, setSelectedCCCs)
                        }
                        className="data-[state=checked]:bg-[#F56304] data-[state=checked]:border-[#F56304]"
                      />
                      <span>{item.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label htmlFor="start-date" className="text-sm font-medium mb-1">
                Start Date *
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                min={todayMin}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Start Time *</label>
              <Input
                type="time"
                value={startTime}
                min={startDate === todayMin ? nowMinIfToday : '00:00'}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="end-date" className="text-sm font-medium mb-1">
                End Date *
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={endDateMinIso}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">End Time *</label>
              <Input
                type="time"
                value={endTime}
                min={
                  endDate && startDate && endDate === startDate
                    ? startTime
                    : '00:00'
                }
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#F56304] hover:bg-[#e05503] text-white"
            >
              {blackout ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
