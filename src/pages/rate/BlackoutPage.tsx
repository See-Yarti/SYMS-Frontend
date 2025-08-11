// src/pages/rate/BlackoutPage.tsx

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, ShieldBan } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import BlackoutDialog from '@/components/Blackout/BlackoutDialog';
import { useAppSelector } from '@/store';
import { useFetchData, useDeleteData, usePostJson, usePatchDataBlackout } from '@/hooks/useOperatorCarClass';
import { format, parseISO } from 'date-fns';

interface Blackout {
  id: string;
  description: string;
  type: 'FULL' | 'PICKUP_ONLY' | 'RETURN_ONLY';
  startDateTime: string;
  endDateTime: string;
  carClasses: {
    id: string; // companyCarClassId
    carClass: {
      id: string;
      slug: string;
      name: string;
    };
  }[];
  locations: {
    id: string;
    city: string;
  }[];
  isActive: boolean;
}

export default function BlackoutPage() {
  const { locationId: paramLocationId } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(paramLocationId) && Boolean(companyId);

  // List by location (new API path)
  const { data: blackouts = [], refetch: refetchBlackouts } = useFetchData<Blackout[]>(
    canOperate ? `blackout/get-by-location/${companyId}/${paramLocationId}` : '',
    ['blackouts', companyId, paramLocationId || ''],
    { enabled: canOperate }
  );

  // Load single for editing (new API path)
  const [editingBlackoutId, setEditingBlackoutId] = React.useState<string | null>(null);
  const { data: editingBlackout } = useFetchData<Blackout>(
    companyId && editingBlackoutId ? `blackout/get-single/${companyId}/${editingBlackoutId}` : '',
    ['blackout', companyId, editingBlackoutId || ''],
    { enabled: Boolean(companyId && editingBlackoutId) }
  );

  // Mutations
  const { mutateAsync: createBlackout } = usePostJson('blackout/add-blackout', {
    onSuccess: () => {
      toast.success('Blackout created successfully!');
      refetchBlackouts();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create blackout');
    },
  });

  const { mutateAsync: updateBlackout } = usePatchDataBlackout({
    onSuccess: () => {
      toast.success('Blackout updated successfully!');
      refetchBlackouts();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update blackout');
    },
  });

  const { mutateAsync: deleteBlackout } = useDeleteData({
    onSuccess: () => {
      toast.success('Blackout deleted successfully!');
      refetchBlackouts();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete blackout');
    }
  });

  // UI state
  const [search] = React.useState<string>('');
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = React.useState<Blackout | null>(null);

  const filteredBlackouts = blackouts.filter(blackout =>
    blackout.description.toLowerCase().includes(search.toLowerCase()) ||
    blackout.locations.some(loc => loc.city.toLowerCase().includes(search.toLowerCase())) ||
    blackout.carClasses.some(cc => cc.carClass.name.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDisplayDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  // Form submit from dialog
  const handleSubmit = async (values: {
    description: string;
    type: 'FULL' | 'PICKUP_ONLY' | 'RETURN_ONLY';
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    carClassIds: string[];
    locationIds: string[];
  }) => {
    const payload = {
      description: values.description,
      type: values.type,
      startDate: values.startDate,
      startTime: values.startTime,
      endDate: values.endDate,
      endTime: values.endTime,
      carClassIds: values.carClassIds,
      locationIds: values.locationIds
    };

    try {
      if (editingBlackoutId) {
        await updateBlackout({
          endpoint: `blackout/${companyId}/${editingBlackoutId}`, // PATCH endpoint
          data: payload,
        });
      } else {
        await createBlackout(payload);
      }
      setDialogOpen(false);
      setEditingBlackoutId(null);
    } catch (error) {
      console.error('Error saving blackout:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (pendingDelete && companyId) {
      try {
        await deleteBlackout({
          endpoint: `blackout/${companyId}/${pendingDelete.id}`
        });
        setDeleteDialogOpen(false);
        setPendingDelete(null);
      } catch (error) {
        console.error('Error deleting blackout:', error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-8 py-8 space-y-10">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <ShieldBan className="w-9 h-9 text-destructive/80" />
          <h1 className="text-3xl font-bold tracking-tight mb-0.5">Blackouts</h1>
        </div>
        <Button
          className="ml-auto gap-2 rounded-xl shadow bg-primary/90 hover:bg-primary"
          size="lg"
          onClick={() => {
            if (canOperate) {
              setEditingBlackoutId(null);
              setDialogOpen(true);
            } else {
              toast.error('Company and Location required');
            }
          }}
          disabled={!canOperate}
        >
          <Plus className="w-5 h-5" /> Add Blackout
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-background/90 overflow-x-auto border border-muted shadow-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/60 text-xs font-semibold uppercase tracking-wider">
              <th className="p-3"></th>
              <th className="p-3">Description</th>
              <th className="p-3">Car Classes</th>
              <th className="p-3">Type</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredBlackouts.length > 0 ? (
              filteredBlackouts.map((blackout, idx) => (
                <tr
                  key={blackout.id}
                  className={`transition-colors duration-100 ${idx % 2 === 0 ? "bg-background/70" : "bg-muted/60"} hover:bg-primary/10`}
                >
                  <td className="px-3 py-2 text-center">
                    <Checkbox />
                  </td>
                  <td className="whitespace-nowrap flex items-center gap-2 py-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-primary/20"
                      onClick={() => {
                        if (canOperate) {
                          setEditingBlackoutId(blackout.id);
                          setDialogOpen(true);
                        } else {
                          toast.error('Company and Location required');
                        }
                      }}
                      disabled={!canOperate}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <span className="font-medium">{blackout.description}</span>
                  </td>
                  <td className="truncate max-w-xs text-center">
                    <span className="inline-flex flex-wrap gap-1 justify-center">
                      {blackout.carClasses.map((cc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-primary/10 rounded-xl text-xs text-primary font-semibold"
                        >
                          {cc.carClass.name} ({cc.carClass.slug})
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={
                        blackout.type === 'FULL'
                          ? "inline-block px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-semibold text-xs"
                          : "inline-block px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-800 font-semibold text-xs"
                      }
                      title={blackout.type}
                    >
                      {blackout.type === 'FULL' ? 'FULL' : blackout.type === 'PICKUP_ONLY' ? 'PICKUP ONLY' : 'RETURN ONLY'}
                    </span>
                  </td>
                  <td className="text-center text-xs">{formatDisplayDate(blackout.startDateTime)}</td>
                  <td className="text-center text-xs">{formatDisplayDate(blackout.endDateTime)}</td>
                  <td className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => {
                        if (canOperate) {
                          setPendingDelete(blackout);
                          setDeleteDialogOpen(true);
                        } else {
                          toast.error('Company and Location required');
                        }
                      }}
                      disabled={!canOperate}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="h-24 text-center text-muted-foreground">
                  {paramLocationId ? 'No blackouts found for this location' : 'Please select a location'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <BlackoutDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingBlackoutId(null);
        }}
        onSave={handleSubmit}
        blackout={editingBlackout}
        companyId={companyId}
        initialLocationId={paramLocationId}
      />

      {/* Delete Confirmation */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-card rounded-2xl p-6 shadow-lg border max-w-sm w-full">
            <div className="font-bold text-lg mb-4 text-destructive">Confirm Delete</div>
            <div className="mb-6">
              Are you sure you want to delete the blackout "{pendingDelete?.description}"?
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
