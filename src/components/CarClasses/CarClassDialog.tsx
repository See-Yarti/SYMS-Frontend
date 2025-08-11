// src/components/CarClasses/CarClassDialog.tsx
import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const VEHICLE_SIZES = [
  { code: 'M', name: 'Mini' }, { code: 'E', name: 'Economy' }, { code: 'C', name: 'Compact' },
  { code: 'I', name: 'Intermediate' }, { code: 'S', name: 'Standard' }, { code: 'F', name: 'Full-size' },
  { code: 'P', name: 'Premium' }, { code: 'L', name: 'Luxury' }, { code: 'X', name: 'Special' },
];
const BODY_TYPES = [
  { code: 'C', name: 'Sedan/Hatchback' }, { code: 'R', name: 'SUV' }, { code: 'V', name: 'Van/MPV' },
  { code: 'W', name: 'Wagon' }, { code: 'T', name: 'Convertible' }, { code: 'P', name: 'Pickup Truck' }, { code: 'E', name: 'Electric' },
];
const TRANSMISSION_TYPES = [
  { code: 'A', name: 'Automatic' }, { code: 'M', name: 'Manual' }, { code: 'B', name: 'AWD/Auto' }, { code: 'D', name: '4WD/Manual' },
];
const FUEL_TYPES = [
  { code: 'R', name: 'Petrol+AC' }, { code: 'N', name: 'Petrol' }, { code: 'D', name: 'Diesel' },
  { code: 'E', name: 'Electric' }, { code: 'H', name: 'Hybrid' }, { code: 'L', name: 'CNG/LPG' },
];

export default function CarClassDialog({
  open,
  onClose,
  onSave,
  editing,
  allCarClasses = [],
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (carClass: any) => void;
  editing: any | null;
  onDelete?: () => void;
  allCarClasses?: any[];
}) {
  const [carClassCode, setCarClassCode] = React.useState(editing?.carClass?.name ?? editing?.code ?? '');
  const [size, setSize] = React.useState<string>('');
  const [body, setBody] = React.useState<string>('');
  const [transmission, setTransmission] = React.useState<string>('');
  const [fuel, setFuel] = React.useState<string>('');

  const [make, setMake] = React.useState(editing?.make ?? '');
  const [model, setModel] = React.useState(editing?.model ?? '');
  const [description, setDescription] = React.useState(editing?.description ?? '');
  const [numberOfDoors, setNumberOfDoors] = React.useState(editing?.numberOfDoors ?? 4);
  const [numberOfPassengers, setNumberOfPassengers] = React.useState(editing?.numberOfPassengers ?? 5);
  const [numberOfBags, setNumberOfBags] = React.useState(editing?.numberOfBags ?? 2);

  const [automation, setAutomation] = React.useState(editing?.isAutomationEnabled ?? true);
  const [overtimeDay, setOvertimeDay] = React.useState(editing?.overTimeAmountPerDay ?? '0.00');
  const [overtimeHour, setOvertimeHour] = React.useState(editing?.overTimeAmountPerHour ?? '0.00');
  const [deposit, setDeposit] = React.useState(editing?.depositAmount ?? '0.00');
  const [customKeep, setCustomKeep] = React.useState(editing?.isCustomKeepDurationEnabled ?? false);

  React.useEffect(() => {
    if (carClassCode && carClassCode.length === 4) {
      setSize(carClassCode[0]);
      setBody(carClassCode[1]);
      setTransmission(carClassCode[2]);
      setFuel(carClassCode[3]);
    } else {
      setSize('');
      setBody('');
      setTransmission('');
      setFuel('');
    }
  }, [carClassCode]);

  React.useEffect(() => {
    setCarClassCode(editing?.carClass?.name ?? editing?.code ?? '');
    setMake(editing?.make ?? '');
    setModel(editing?.model ?? '');
    setDescription(editing?.description ?? '');
    setNumberOfDoors(editing?.numberOfDoors ?? 4);
    setNumberOfPassengers(editing?.numberOfPassengers ?? 5);
    setNumberOfBags(editing?.numberOfBags ?? 2);
    setAutomation(editing?.isAutomationEnabled ?? true);
    setOvertimeDay(editing?.overTimeAmountPerDay ?? '0.00');
    setOvertimeHour(editing?.overTimeAmountPerHour ?? '0.00');
    setDeposit(editing?.depositAmount ?? '0.00');
    setCustomKeep(editing?.isCustomKeepDurationEnabled ?? false);

    if (editing?.carClass?.name) {
      setSize(editing.carClass.name[0]);
      setBody(editing.carClass.name[1]);
      setTransmission(editing.carClass.name[2]);
      setFuel(editing.carClass.name[3]);
    }
  }, [editing, open]);

  function labelForACRISS(code: string, arr: { code: string; name: string }[]) {
    return arr.find(opt => opt.code === code)?.name || '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      carClassId: allCarClasses.find(c => c.name === carClassCode)?.id || editing?.carClass?.id || '',
      make,
      model,
      description,
      numberOfDoors: Number(numberOfDoors),
      numberOfPassengers: Number(numberOfPassengers),
      numberOfBags: Number(numberOfBags),
      overTimeAmountPerDay: overtimeDay,
      overTimeAmountPerHour: overtimeHour,
      depositAmount: deposit,
      isAutomationEnabled: automation,
      isCustomKeepDurationEnabled: customKeep,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl shadow-xl border border-border bg-card text-card-foreground px-8 py-6">
        <DialogHeader>
          <div className="flex justify-between items-center mb-2">
            <DialogTitle className="text-2xl font-bold">{editing ? 'Update' : 'Add'} Car Class</DialogTitle>
          </div>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1">Car Class Code *</Label>
              <Select
                value={carClassCode}
                onValueChange={setCarClassCode}
              >
                <SelectTrigger className="w-full bg-background border border-input rounded-md focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Select Car Class Code" />
                </SelectTrigger>
                <SelectContent>
                  {allCarClasses.map((cc) => (
                    <SelectItem key={cc.id} value={cc.name}>
                      <span className="font-mono font-bold">{cc.name}</span>
                      {cc.description ? <span className="ml-2 text-xs text-muted-foreground">{cc.description}</span> : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1">Make *</Label>
              <Input className="w-full bg-background border border-input rounded-md" value={make} onChange={e => setMake(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1">Model *</Label>
              <Input className="w-full bg-background border border-input rounded-md" value={model} onChange={e => setModel(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1">Description</Label>
              <Input className="w-full bg-background border border-input rounded-md" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted px-3 py-3 rounded-xl border border-muted">
            <div>
              <Label className="mb-1">Vehicle Size *</Label>
              <Input value={size ? `${size} - ${labelForACRISS(size, VEHICLE_SIZES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
            <div>
              <Label className="mb-1">Body Type *</Label>
              <Input value={body ? `${body} - ${labelForACRISS(body, BODY_TYPES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
            <div>
              <Label className="mb-1">Transmission *</Label>
              <Input value={transmission ? `${transmission} - ${labelForACRISS(transmission, TRANSMISSION_TYPES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
            <div>
              <Label className="mb-1">Fuel Type *</Label>
              <Input value={fuel ? `${fuel} - ${labelForACRISS(fuel, FUEL_TYPES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="mb-1">Doors *</Label>
              <Input
                type="number"
                min={2}
                className="w-full bg-background border border-input rounded-md"
                value={numberOfDoors}
                onChange={e => setNumberOfDoors(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label className="mb-1">Passengers *</Label>
              <Input
                type="number"
                min={1}
                className="w-full bg-background border border-input rounded-md"
                value={numberOfPassengers}
                onChange={e => setNumberOfPassengers(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label className="mb-1">Baggage *</Label>
              <Input
                type="number"
                min={0}
                className="w-full bg-background border border-input rounded-md"
                value={numberOfBags}
                onChange={e => setNumberOfBags(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label className="mb-1">Deposit Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                className="w-full bg-background border border-input rounded-md"
                value={deposit}
                onChange={e => setDeposit(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="mb-1">OT/Day ($)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                className="w-full bg-background border border-input rounded-md"
                value={overtimeDay}
                onChange={e => setOvertimeDay(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="mb-1">OT/Hour ($)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                className="w-full bg-background border border-input rounded-md"
                value={overtimeHour}
                onChange={e => setOvertimeHour(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Checkbox checked={automation} onCheckedChange={val => setAutomation(val === true)} id="automation-check" />
              <Label htmlFor="automation-check" className="mb-0 cursor-pointer">Automation Enabled</Label>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Checkbox checked={customKeep} onCheckedChange={val => setCustomKeep(val === true)} id="customkeep-check" />
              <Label htmlFor="customkeep-check" className="mb-0 cursor-pointer">Custom Keep Duration</Label>
            </div>
          </div>

          <DialogFooter className="mt-8 gap-3 flex-row justify-end">
            {editing && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} className="mr-auto">
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="font-semibold">
              Cancel
            </Button>
            <Button type="submit" variant="default" className="font-semibold">
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}