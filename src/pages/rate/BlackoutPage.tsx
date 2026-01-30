// src/pages/rate/BlackoutPage.tsx

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus, Search, RefreshCw, MoreVertical, ShieldBan } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = React.useState<Blackout | null>(null);

  const filteredBlackouts = blackouts.filter(blackout =>
    blackout.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blackout.locations.some(loc => loc.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    blackout.carClasses.some(cc => cc.carClass.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Blackouts Management</h1>
      </div>

      {/* Combined Filter + Table Card - Exact design match */}
      <div className="rounded-[20px] bg-white border border-gray-200 shadow-md overflow-hidden">
        {/* Search and Filter Bar with Add Button - Full width */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search description, car classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg border-gray-300 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchBlackouts()}
            className="rounded-lg border-gray-300 h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              if (canOperate) {
                setEditingBlackoutId(null);
                setDialogOpen(true);
              } else {
                toast.error('Company and Location required');
              }
            }}
            disabled={!canOperate}
            className="gap-2 rounded-lg bg-[#F56304] hover:bg-[#e05503] text-white h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            Add Blackout
          </Button>
        </div>

        {/* Table */}
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Description
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Car Classes
              </th>
              <th className="px-6 py-3.5 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Type
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Start
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                End
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredBlackouts.length > 0 ? (
              filteredBlackouts.map((blackout, idx) => (
                <tr
                  key={blackout.id}
                  className={
                    idx % 2 === 0
                      ? 'bg-white hover:bg-gray-50/50 transition-colors'
                      : 'bg-gray-50/30 hover:bg-gray-50/50 transition-colors'
                  }
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#F56304] text-sm">
                      {blackout.description}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex flex-wrap gap-1">
                      {blackout.carClasses.map((cc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-orange-100 rounded-full text-xs text-[#F56304] font-semibold"
                        >
                          {cc.carClass.name}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={
                        blackout.type === 'FULL'
                          ? "inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium text-xs"
                          : "inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium text-xs"
                      }
                    >
                      {blackout.type === 'FULL' ? 'FULL' : blackout.type === 'PICKUP_ONLY' ? 'PICKUP ONLY' : 'RETURN ONLY'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDisplayDate(blackout.startDateTime)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDisplayDate(blackout.endDateTime)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            if (canOperate) {
                              setEditingBlackoutId(blackout.id);
                              setDialogOpen(true);
                            } else {
                              toast.error('Company and Location required');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (canOperate) {
                              setPendingDelete(blackout);
                              setDeleteDialogOpen(true);
                            } else {
                              toast.error('Company and Location required');
                            }
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center gap-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-[#F56304] flex items-center justify-center">
                      <ShieldBan className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Primary Message */}
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        No Blackout records found
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md">
                        {searchQuery ? (
                          <>Try adjusting your search filters. We will show blackout records that match your criteria as soon as they are available.</>
                        ) : paramLocationId ? (
                          <>No blackouts found for this location. Click <span className="font-semibold">Add Blackout</span> to create one.</>
                        ) : (
                          <>Please select a location to view blackouts.</>
                        )}
                      </p>
                    </div>
                  </div>
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
