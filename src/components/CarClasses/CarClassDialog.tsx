// src/components/CarClasses/CarClassDialog.tsx

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { CarClass } from '@/pages/rate/CarClassesPage';

const CATEGORIES = ['E - Economy', 'C - Compact', 'S - Standard', 'F - Fullsize'];
const TYPES = ['C - 2/4 Door', 'S - SUV', 'V - Van'];
const TRANSMISSIONS = ['A - Auto (drive unspec)', 'M - Manual'];
const FUELS = ['R - Unspecified Fuel W', 'G - Gasoline', 'D - Diesel'];
const OT_METHODS = ['Percentage', 'Fixed'];

interface CarClassDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (carClass: CarClass) => void;
  editing: CarClass | null;
  onDelete?: () => void;
}

export default function CarClassDialog({
  open,
  onClose,
  onSave,
  editing,
  onDelete,
}: CarClassDialogProps) {
  // Controlled state for fields (init from editing, else defaults)
  const [enabled, setEnabled] = React.useState<boolean>(editing?.enabled ?? true);
  const [code, setCode] = React.useState<string>(editing?.code ?? '');
  const [category, setCategory] = React.useState<string>(editing?.category ?? CATEGORIES[0]);
  const [type, setType] = React.useState<string>(editing?.type ?? TYPES[0]);
  const [transmission, setTransmission] = React.useState<string>(editing?.transmission ?? TRANSMISSIONS[0]);
  const [fuel, setFuel] = React.useState<string>(editing?.fuel ?? FUELS[0]);
  const [make, setMake] = React.useState<string>(editing?.make ?? '');
  const [model, setModel] = React.useState<string>(editing?.model ?? '');
  const [description, setDescription] = React.useState<string>(editing?.description ?? '');
  const [doors, setDoors] = React.useState<string>(editing?.doors?.toString() ?? '4');
  const [passengers, setPassengers] = React.useState<string>(editing?.passengers?.toString() ?? '5');
  const [baggages, setBaggages] = React.useState<string>(editing?.baggages?.toString() ?? '3');
  const [automation, setAutomation] = React.useState<boolean>(editing?.automation ?? true);
  const [overtimeDay, setOvertimeDay] = React.useState<string>(editing?.overtimeDay?.toString() ?? '50');
  const [overtimeHour, setOvertimeHour] = React.useState<string>(editing?.overtimeHour?.toString() ?? '25');
  const [otMethod, setOtMethod] = React.useState<string>(editing?.otMethod ?? OT_METHODS[0]);
  const [deposit, setDeposit] = React.useState<string>(editing?.deposit?.toString() ?? '500');
  const [customKeep, setCustomKeep] = React.useState<boolean>(editing?.customKeep ?? false);

  React.useEffect(() => {
    if (editing) {
      setEnabled(editing.enabled);
      setCode(editing.code);
      setCategory(editing.category);
      setType(editing.type);
      setTransmission(editing.transmission);
      setFuel(editing.fuel);
      setMake(editing.make);
      setModel(editing.model);
      setDescription(editing.description);
      setDoors(editing.doors?.toString());
      setPassengers(editing.passengers?.toString());
      setBaggages(editing.baggages?.toString());
      setAutomation(editing.automation);
      setOvertimeDay(editing.overtimeDay?.toString());
      setOvertimeHour(editing.overtimeHour?.toString());
      setOtMethod(editing.otMethod);
      setDeposit(editing.deposit?.toString());
      setCustomKeep(editing.customKeep);
    } else {
      setEnabled(true);
      setCode('');
      setCategory(CATEGORIES[0]);
      setType(TYPES[0]);
      setTransmission(TRANSMISSIONS[0]);
      setFuel(FUELS[0]);
      setMake('');
      setModel('');
      setDescription('');
      setDoors('4');
      setPassengers('5');
      setBaggages('3');
      setAutomation(true);
      setOvertimeDay('50');
      setOvertimeHour('25');
      setOtMethod(OT_METHODS[0]);
      setDeposit('500');
      setCustomKeep(false);
    }
  }, [editing, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: editing?.id ?? 0,
      enabled, code, category, type, transmission, fuel,
      make, model, description,
      doors: Number(doors), passengers: Number(passengers), baggages: Number(baggages),
      automation,
      overtimeDay: Number(overtimeDay),
      overtimeHour: Number(overtimeHour),
      otMethod,
      deposit: Number(deposit),
      customKeep,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-background text-foreground rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">{editing ? 'Update' : 'Add'} Car Class</DialogTitle>
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl">
              <span className="font-medium">Enabled</span>
              <Checkbox checked={enabled} onCheckedChange={val => setEnabled(val === true)} />
            </div>
          </div>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Car Class Code *" required />
            <Input value={make} onChange={e => setMake(e.target.value)} placeholder="Make *" required />
            <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Model *" required />
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category *" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Type *" /></SelectTrigger>
              <SelectContent>
                {TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={transmission} onValueChange={setTransmission}>
              <SelectTrigger><SelectValue placeholder="Transmission *" /></SelectTrigger>
              <SelectContent>
                {TRANSMISSIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fuel} onValueChange={setFuel}>
              <SelectTrigger><SelectValue placeholder="Fuel *" /></SelectTrigger>
              <SelectContent>
                {FUELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input value={doors} onChange={e => setDoors(e.target.value)} type="number" placeholder="Doors *" required />
            <Input value={passengers} onChange={e => setPassengers(e.target.value)} type="number" placeholder="Passengers *" required />
            <Input value={baggages} onChange={e => setBaggages(e.target.value)} type="number" placeholder="Baggage *" required />
            <Input value={deposit} onChange={e => setDeposit(e.target.value)} type="number" placeholder="Deposit $" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input value={overtimeDay} onChange={e => setOvertimeDay(e.target.value)} type="number" placeholder="OT/Day $" />
            <Input value={overtimeHour} onChange={e => setOvertimeHour(e.target.value)} type="number" placeholder="OT/Hour $" />
            <Select value={otMethod} onValueChange={setOtMethod}>
              <SelectTrigger><SelectValue placeholder="OT Calculation" /></SelectTrigger>
              <SelectContent>
                {OT_METHODS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="font-medium">Automation</span>
              <Checkbox checked={automation} onCheckedChange={val => setAutomation(val === true)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">Custom Keep Durations</span>
            <Checkbox checked={customKeep} onCheckedChange={val => setCustomKeep(val === true)} />
          </div>
          <DialogFooter className="mt-8 gap-3 flex-row">
            {editing && (
              <Button type="button" variant="destructive" onClick={() => { onDelete?.(); onClose(); }}>
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default">{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
