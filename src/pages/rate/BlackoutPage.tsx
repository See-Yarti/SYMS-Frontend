// src/pages/rate/BlackoutPage.tsx

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, ShieldBan, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import BlackoutDialog from '@/components/Blackout/BlackoutDialog';
import type { Blackout } from '@/types/blackout';

const LOCATIONS = ['Marietta', 'Atlanta', 'Dallas'];
const CREATION_METHODS = ['All', 'Manual', 'Auto'];
const CAR_CLASSES = ['ECAR', 'CCAR', 'ICAR', 'SCAR', 'FCAR', 'MVAR', 'SSAR', 'LCAR', 'FFDR'];
const RATE_BLACKOUT_TYPES = ['Full', 'Partial'];

const INITIAL_BLACKOUTS: Blackout[] = [
  {
    id: 1,
    description: 'sold out',
    locations: ['Marietta'],
    group: 'All',
    carClasses: ['FFDR', 'ICAR', 'SCAR', 'FCAR', '...'],
    blackoutType: 'Full',
    startDate: 'July 10, 2025 12:00 AM',
    endDate: 'July 31, 2025 11:59 PM',
    created: 'July 10, 2025',
    modified: '07/10/2025 by marietta@pricelesscarrental.com'
  }
];

export default function BlackoutPage() {
  const [location, setLocation] = React.useState<string>('Marietta');
  const [creationMethod, setCreationMethod] = React.useState<string>('All');
  const [search, setSearch] = React.useState<string>('');
  const [blackouts, setBlackouts] = React.useState<Blackout[]>(INITIAL_BLACKOUTS);

  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [editing, setEditing] = React.useState<Blackout | null>(null);

  function handleAdd(newBlk: Blackout) {
    setBlackouts(blks => [
      ...blks,
      {
        ...newBlk,
        id: blks.length ? Math.max(...blks.map(b => b.id)) + 1 : 1,
        created: 'Today',
        modified: 'Now by you@demo.com'
      }
    ]);
    setDialogOpen(false);
    setEditing(null);
  }

  function handleEdit(updatedBlk: Blackout) {
    setBlackouts(blks =>
      blks.map(b => b.id === updatedBlk.id ? { ...updatedBlk, modified: 'Now by you@demo.com' } : b)
    );
    setDialogOpen(false);
    setEditing(null);
  }

  function handleOpenAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function handleOpenEdit(blk: Blackout) {
    setEditing(blk);
    setDialogOpen(true);
  }

  function handleDelete(id: number) {
    setBlackouts(blks => blks.filter(b => b.id !== id));
  }

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-8 py-8 space-y-10">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-3 ">
          <ShieldBan className="w-9 h-9 text-destructive/80" />
          <h1 className="text-3xl font-bold tracking-tight mb-0.5">Blackouts</h1>
        </div>
        <Button
          className="ml-auto gap-2 rounded-xl shadow bg-primary/90 hover:bg-primary"
          size="lg"
          onClick={handleOpenAdd}
        >
          <Plus className="w-5 h-5" /> Add Blackout
        </Button>
      </div>

      {/* Filter/Search Card */}
      <div className="rounded-xl border border-muted/70 bg-background/80 shadow-sm flex flex-wrap gap-4 items-center px-4 py-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Filters</span>
        </div>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-44 rounded-lg shadow-sm">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={creationMethod} onValueChange={setCreationMethod}>
          <SelectTrigger className="w-32 rounded-lg shadow-sm">
            <SelectValue placeholder="Creation Method" />
          </SelectTrigger>
          <SelectContent>
            {CREATION_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search blackout, car class..."
          className="w-64 rounded-lg shadow-sm"
        />
        <Button variant="outline" className="rounded-xl shadow-sm">
          Search
        </Button>
      </div>

      {/* Blackout Table */}
      <div className="rounded-2xl bg-background/90 overflow-x-auto border border-muted shadow-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/60 text-xs font-semibold uppercase tracking-wider">
              <th className="p-3"></th>
              <th className="p-3">Description</th>
              <th className="p-3">Locations</th>
              <th className="p-3">Group</th>
              <th className="p-3">Car Classes</th>
              <th className="p-3">Type</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {blackouts.map((b, idx) => (
              <tr
                key={b.id}
                className={`transition-colors duration-100 ${idx % 2 === 0 ? "bg-background/70" : "bg-muted/60"
                  } hover:bg-primary/10`}
              >
                <td className="px-3 py-2 text-center">
                  <Checkbox />
                </td>
                <td className="whitespace-nowrap flex items-center gap-2 py-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-primary/20"
                    onClick={() => handleOpenEdit(b)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">{b.description}</span>
                </td>
                <td className="text-center">{b.locations.length} Location</td>
                <td className="text-center">{b.group}</td>
                <td className="truncate max-w-xs text-center">
                  <span className="inline-flex flex-wrap gap-1 justify-center">
                    {b.carClasses.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-primary/10 rounded-xl text-xs text-primary font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="text-center">
                  <span
                    className={
                      b.blackoutType === 'Full'
                        ? "inline-block px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold text-xs"
                        : "inline-block px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-800 font-semibold text-xs"
                    }
                  >
                    {b.blackoutType}
                  </span>
                </td>
                <td className="text-center text-xs">{b.startDate}</td>
                <td className="text-center text-xs">{b.endDate}</td>
                <td className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {blackouts.length === 0 && (
              <tr>
                <td colSpan={9} className="h-24 text-center text-muted-foreground">
                  No blackouts found. Try changing filters or add a blackout.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BlackoutDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={editing ? handleEdit : handleAdd}
        blackout={editing}
        locations={LOCATIONS}
        carClasses={CAR_CLASSES}
        blackoutTypes={RATE_BLACKOUT_TYPES}
      />
    </div>
  );
}
