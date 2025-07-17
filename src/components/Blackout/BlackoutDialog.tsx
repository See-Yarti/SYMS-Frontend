// src/components/Blackout/BlackoutDialog.tsx

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { BlackoutDialogProps } from '@/types/blackout';

interface CarClassSelectItem {
  label: string;
  selected: boolean;
}

function moveSelected(
  from: CarClassSelectItem[],
  to: CarClassSelectItem[],
  setFrom: React.Dispatch<React.SetStateAction<CarClassSelectItem[]>>,
  setTo: React.Dispatch<React.SetStateAction<CarClassSelectItem[]>>
) {
  const toMove = from.filter(x => x.selected);
  setFrom(from.filter(x => !x.selected));
  setTo([...to, ...toMove.map(x => ({ ...x, selected: false }))]);
}

function moveAll(
  from: CarClassSelectItem[],
  setFrom: React.Dispatch<React.SetStateAction<CarClassSelectItem[]>>,
  to: CarClassSelectItem[],
  setTo: React.Dispatch<React.SetStateAction<CarClassSelectItem[]>>
) {
  setTo([...to, ...from.map(x => ({ ...x, selected: false }))]);
  setFrom([]);
}

export default function BlackoutDialog({
  open,
  onClose,
  onSave,
  blackout,
  locations = ['Marietta'],
  carClasses = ['ECAR', 'CCAR', 'ICAR', 'SCAR', 'FCAR', 'MVAR', 'SSAR', 'LCAR', 'FFDR'],
  blackoutTypes = ['Full', 'Partial'],
}: BlackoutDialogProps) {
  // Main fields
  const [description, setDescription] = React.useState<string>(blackout?.description || '');
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>(blackout?.locations || [locations[0]]);
  const [rateGroup, setRateGroup] = React.useState<string>(blackout?.group || 'All');
  const [startDate, setStartDate] = React.useState<string>('');
  const [startTime, setStartTime] = React.useState<string>('00:00');
  const [endDate, setEndDate] = React.useState<string>('');
  const [endTime, setEndTime] = React.useState<string>('23:59');
  const [blackoutType, setBlackoutType] = React.useState<string>(blackout?.blackoutType || 'Full');
  const [rateCategory, setRateCategory] = React.useState<string>('All');
  const [lengthOfRents, setLengthOfRents] = React.useState<string>('All');

  // Car Classes dual-list
  const [unblocked, setUnblocked] = React.useState<CarClassSelectItem[]>(
    blackout
      ? carClasses.filter(c => !(blackout.carClasses || []).includes(c)).map(c => ({ label: c, selected: false }))
      : carClasses.map(c => ({ label: c, selected: false }))
  );
  const [blocked, setBlocked] = React.useState<CarClassSelectItem[]>(
    blackout?.carClasses
      ? blackout.carClasses.map(c => ({ label: c, selected: false }))
      : []
  );

  // Reset form when opening (support Add/Edit)
  React.useEffect(() => {
    setDescription(blackout?.description || '');
    setSelectedLocations(blackout?.locations || [locations[0]]);
    setRateGroup(blackout?.group || 'All');
    setBlackoutType(blackout?.blackoutType || 'Full');
    setRateCategory('All');
    setLengthOfRents('All');
    setStartDate('');
    setStartTime('00:00');
    setEndDate('');
    setEndTime('23:59');
    setUnblocked(
      blackout
        ? carClasses.filter(c => !(blackout.carClasses || []).includes(c)).map(c => ({ label: c, selected: false }))
        : carClasses.map(c => ({ label: c, selected: false }))
    );
    setBlocked(
      blackout?.carClasses
        ? blackout.carClasses.map(c => ({ label: c, selected: false }))
        : []
    );
  }, [open, blackout, carClasses, locations]);

  function toggleSelected(
    list: CarClassSelectItem[],
    idx: number,
    setList: React.Dispatch<React.SetStateAction<CarClassSelectItem[]>>
  ) {
    setList(list.map((x, i) => (i === idx ? { ...x, selected: !x.selected } : x)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: blackout?.id ?? Math.random(),
      description,
      locations: selectedLocations,
      group: rateGroup,
      carClasses: blocked.map(x => x.label),
      blackoutType,
      startDate: startDate + ' ' + startTime,
      endDate: endDate + ' ' + endTime,
      created: blackout?.created || 'Now',
      modified: 'Now by you@demo.com',
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-background/95 text-foreground rounded-2xl border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {blackout ? 'Update' : 'Create'} Blackout
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-5 gap-4 items-center">
            <Input
              className="col-span-1"
              placeholder="Description *"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
            <Select
              value={selectedLocations[0]}
              onValueChange={v => setSelectedLocations([v])}
            >
              <SelectTrigger className="col-span-1 w-full">
                <SelectValue placeholder="Location(s)" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={rateGroup} onValueChange={setRateGroup}>
              <SelectTrigger className="col-span-1 w-full">
                <SelectValue placeholder="Rate Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Group1">Group1</SelectItem>
                <SelectItem value="Group2">Group2</SelectItem>
              </SelectContent>
            </Select>
            <div className="col-span-2 flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-40"
                required
              />
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-40"
                required
              />
            </div>
            <div className="col-span-1 flex gap-2">
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-40"
                required
              />
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-40"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 items-center">
            <Select value={blackoutType} onValueChange={setBlackoutType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rate Blackout Type" />
              </SelectTrigger>
              <SelectContent>
                {blackoutTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={rateCategory} onValueChange={setRateCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rate Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Cat1">Cat1</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lengthOfRents} onValueChange={setLengthOfRents}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Length of Rents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
                <SelectItem value="Long">Long</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center col-span-2">
              <Checkbox className="mr-1" />Sync to Rezpower
              <Checkbox className="ml-4 mr-1" />Net Avail Blackout
            </div>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Please select the car classes you would like to move between the blocked and unblocked columns.
          </div>
          {/* Car Classes dual list */}
          <div>
            <div className="mb-2 font-semibold">Car Classes</div>
            <div className="flex">
              {/* Unblocked */}
              <div className="w-44 bg-background border border-muted rounded max-h-52 overflow-y-auto">
                <div className="text-xs px-2 py-1 border-b border-muted">Unblocked<br />{unblocked.filter(x => x.selected).length} selected</div>
                {unblocked.map((c, i) => (
                  <div key={c.label} className="flex items-center px-2">
                    <Checkbox
                      checked={c.selected}
                      onCheckedChange={() => toggleSelected(unblocked, i, setUnblocked)}
                      className="mr-1"
                    />
                    {c.label}
                  </div>
                ))}
              </div>
              {/* Move Buttons */}
              <div className="flex flex-col justify-center items-center mx-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveAll(unblocked, setUnblocked, blocked, setBlocked)}
                  className="w-40"
                  type="button"
                >Block All &gt;&gt;</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveSelected(unblocked, blocked, setUnblocked, setBlocked)}
                  className="w-40"
                  type="button"
                >Block &gt;</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveSelected(blocked, unblocked, setBlocked, setUnblocked)}
                  className="w-40"
                  type="button"
                >&lt; Unblock</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveAll(blocked, setBlocked, unblocked, setUnblocked)}
                  className="w-40"
                  type="button"
                >&lt;&lt; Unblock All</Button>
              </div>
              {/* Blocked */}
              <div className="w-44 bg-background border border-muted rounded max-h-52 overflow-y-auto">
                <div className="text-xs px-2 py-1 border-b border-muted">Blocked<br />{blocked.filter(x => x.selected).length} selected</div>
                {blocked.map((c, i) => (
                  <div key={c.label} className="flex items-center px-2">
                    <Checkbox
                      checked={c.selected}
                      onCheckedChange={() => toggleSelected(blocked, i, setBlocked)}
                      className="mr-1"
                    />
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{blackout ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </form>
        {blackout && (
          <div className="text-xs text-muted-foreground mt-4 border-t pt-2">
            Created: {blackout.created} <br />
            Modified: {blackout.modified}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
