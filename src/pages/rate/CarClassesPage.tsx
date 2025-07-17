// src/pages/rate/CarClassesPage.tsx

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Car, PlusCircle } from 'lucide-react';
import CarClassDialog from '@/components/CarClasses/CarClassDialog';

// --- Types ---
export interface CarClass {
  id: number;
  enabled: boolean;
  code: string;
  make: string;
  model: string;
  doors: number;
  passengers: number;
  baggages: number;
  automation: boolean;
  category: string;
  type: string;
  transmission: string;
  fuel: string;
  description: string;
  overtimeDay: number;
  overtimeHour: number;
  otMethod: string;
  deposit: number;
  customKeep: boolean;
}

const MOCK_CLASSES: CarClass[] = [
  {
    id: 1, enabled: true, code: 'ECAR', make: 'Toyota', model: 'Yaris', doors: 4, passengers: 5, baggages: 3,
    automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W',
    description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false
  },
  { id: 2, enabled: true, code: 'CCAR', make: 'Hyundai', model: 'Accent', doors: 4, passengers: 5, baggages: 5, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 3, enabled: true, code: 'ICAR', make: 'Toyota', model: 'Corolla', doors: 4, passengers: 5, baggages: 5, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 4, enabled: true, code: 'SCAR', make: 'Ford', model: 'Focus', doors: 4, passengers: 5, baggages: 5, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 5, enabled: true, code: 'FCAR', make: 'Ford', model: 'Fusion', doors: 4, passengers: 5, baggages: 5, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 6, enabled: true, code: 'MVAR', make: 'Dodge', model: 'Grand Caravan', doors: 4, passengers: 7, baggages: 7, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 7, enabled: true, code: 'SSAR', make: 'Ford', model: 'Mustang', doors: 4, passengers: 5, baggages: 3, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 8, enabled: true, code: 'CFDR', make: 'Mazda', model: 'CX-5', doors: 4, passengers: 5, baggages: 7, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 9, enabled: true, code: 'IFDR', make: 'Toyota', model: 'RAV4', doors: 4, passengers: 5, baggages: 7, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
  { id: 10, enabled: true, code: 'FFDR', make: 'Dodge', model: 'Durango', doors: 4, passengers: 5, baggages: 7, automation: true, category: 'E - Economy', type: 'C - 2/4 Door', transmission: 'A - Auto (drive unspec)', fuel: 'R - Unspecified Fuel W', description: '', overtimeDay: 50, overtimeHour: 25, otMethod: 'Percentage', deposit: 500, customKeep: false },
];

export default function CarClassesPage() {
  const [classes, setClasses] = React.useState<CarClass[]>(MOCK_CLASSES);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CarClass | null>(null);

  // CRUD Handlers
  function handleAdd(carClass: CarClass) {
    setClasses(c => [
      ...c,
      { ...carClass, id: c.length ? Math.max(...c.map(x => x.id)) + 1 : 1 }
    ]);
    setDialogOpen(false); setEditing(null);
  }
  function handleEdit(carClass: CarClass) {
    setClasses(c => c.map(cl => cl.id === carClass.id ? { ...carClass } : cl));
    setDialogOpen(false); setEditing(null);
  }
  function handleDelete(id: number) {
    setClasses(c => c.filter(cl => cl.id !== id));
    setDialogOpen(false); setEditing(null);
  }
  function handleToggle(id: number) {
    setClasses(c => c.map(cl => cl.id === id ? { ...cl, enabled: !cl.enabled } : cl));
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Car className="w-10 h-10 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Car Classes</h1>
        <Button
          className="ml-auto gap-2 rounded-xl shadow bg-gradient-to-r from-primary to-primary/80 text-base"
          size="lg"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <PlusCircle className="h-5 w-5" />
          Add Car Class
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-muted shadow-lg overflow-x-auto">
        <table className="min-w-full text-[15px]">
          <thead>
            <tr className="bg-muted/70 text-xs font-semibold uppercase tracking-wide">
              <th className="p-3"></th>
              <th className="p-3 text-center">Enabled</th>
              <th className="p-3">Code</th>
              <th className="p-3">Make</th>
              <th className="p-3">Model</th>
              <th className="p-3 text-center">Doors</th>
              <th className="p-3 text-center">Passengers</th>
              <th className="p-3 text-center">Baggage</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cl, idx) => (
              <tr
                key={cl.id}
                className={`
                  transition-colors
                  ${cl.enabled
                    ? ''
                    : idx % 2 === 0
                      ? 'bg-background'
                      : 'bg-muted/30'}
                  border-b border-muted/50
                  `}
              >
                <td className="text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-primary/15"
                    onClick={() => { setEditing(cl); setDialogOpen(true); }}
                    aria-label="Edit Car Class"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </td>
                <td className="text-center">
                  <Checkbox
                    checked={cl.enabled}
                    onCheckedChange={() => handleToggle(cl.id)}
                    className={cl.enabled ? "" : ""}
                  />
                </td>
                <td className="text-center text-primary">{cl.code}</td>
                <td className="text-center">{cl.make}</td>
                <td className="text-center">{cl.model}</td>
                <td className="text-center">{cl.doors}</td>
                <td className="text-center">{cl.passengers}</td>
                <td className="text-center">{cl.baggages}</td>
                <td className="text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => { setEditing(cl); setDialogOpen(true); }}
                    aria-label="Delete Car Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={10} className="h-24 text-center text-muted-foreground text-lg">
                  <span>No car classes found. Click <b>Add Car Class</b> to get started.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Add/Edit dialog */}
      <CarClassDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={editing ? handleEdit : handleAdd}
        onDelete={editing ? () => handleDelete(editing.id) : undefined}
        editing={editing}
      />
    </div>
  );
}
