// src/pages/rate/CarClassesPage.tsx
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Car, PlusCircle } from 'lucide-react';
import CarClassDialog from '@/components/CarClasses/CarClassDialog';
import { useFetchData, usePostData, usePutData, useDeleteData } from '@/hooks/useOperatorCarClass';
import { useAppSelector } from '@/store';

interface CarClassAPI {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanyCarClass {
  id: string;
  carClass: CarClassAPI;
  make: string;
  model: string;
  isAvailable: boolean;
  numberOfBags: number;
  numberOfDoors: number;
  numberOfPassengers: number;
  description?: string;
  overTimeAmountPerDay?: string;
  overTimeAmountPerHour?: string;
  depositAmount?: string;
  isAutomationEnabled?: boolean;
  isCustomKeepDurationEnabled?: boolean;
}

export default function CarClassesPage() {
  const { locationId } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(locationId) && Boolean(companyId);

  const { data: allCarClasses = [] } = useFetchData<CarClassAPI[]>(
    'car-class/filter-car-classes',
    ['car-class-filter']
  );

  const { data: companyCarClasses = [], refetch } = useFetchData<CompanyCarClass[]>(
    canOperate ? `company-car-class/${companyId}/${locationId}` : '',
    ['company-car-classes', companyId, locationId || '']
  );

  const { mutateAsync: createCarClass } = usePostData('company-car-class', {
    onSuccess: async () => {
      toast.success('Car class added successfully!');
      await refetch();
    },
    onError: (error: any) => {
      console.error('Error creating car class:', error);
      if (error?.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(`${err.field}: ${err.constraints.join(', ')}`);
        });
      } else {
        toast.error(error?.response?.data?.message || 'Failed to add car class');
      }
    },
  });

  const { mutateAsync: updateCarClass } = usePutData({
    onSuccess: async () => {
      toast.success('Car class updated successfully!');
      await refetch();
    },
    onError: (error: any) => {
      console.error('Error updating car class:', error);
      if (error?.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(`${err.field}: ${err.constraints.join(', ')}`);
        });
      } else {
        toast.error(error?.response?.data?.message || 'Failed to update car class');
      }
    },
  });

  const { mutateAsync: deleteCarClass } = useDeleteData({
    onSuccess: async () => {
      toast.success('Car class deleted successfully!');
      await refetch();
    },
    onError: (error: any) => {
      console.error('Error deleting car class:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete car class');
    },
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompanyCarClass | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<CompanyCarClass | null>(null);

  async function handleSave(values: any) {
    const payload = {
      companyId,
      locationId: locationId || '',
      carClassId: values.carClassId,
      make: values.make,
      model: values.model,
      isAvailable: true,
      description: values.description || null,
      numberOfBags: values.numberOfBags,
      numberOfDoors: values.numberOfDoors,
      numberOfPassengers: values.numberOfPassengers,
      overTimeAmountPerDay: values.overTimeAmountPerDay || '0.00',
      overTimeAmountPerHour: values.overTimeAmountPerHour || '0.00',
      depositAmount: values.depositAmount || '0.00',
      isAutomationEnabled: values.isAutomationEnabled,
      isCustomKeepDurationEnabled: values.isCustomKeepDurationEnabled,
    };

    try {
      if (editing) {
        await updateCarClass({
          endpoint: `company-car-class/${companyId}/${locationId}/${editing.id}`,
          data: payload,
        });
      } else {
        await createCarClass(payload);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      console.error('Error saving car class:', error);
    }
  }

  async function confirmDelete() {
    if (pendingDelete) {
      try {
        await deleteCarClass({
          endpoint: `company-car-class/${companyId}/${locationId}/${pendingDelete.id}`
        });
        setDeleteDialogOpen(false);
        setPendingDelete(null);
      } catch (error) {
        console.error('Error deleting car class:', error);
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-8 space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Car className="w-10 h-10 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Car Classes</h1>
        <Button
          className="ml-auto gap-2 rounded-xl shadow bg-gradient-to-r from-primary to-primary/80 text-base"
          size="lg"
          onClick={() => {
            if (canOperate) {
              setEditing(null);
              setDialogOpen(true);
            } else {
              toast.error('Company and Location required');
            }
          }}
          disabled={!canOperate}
        >
          <PlusCircle className="h-5 w-5" />
          Add Car Class
        </Button>
      </div>

      <div className="rounded-2xl bg-card border border-muted shadow-lg overflow-x-auto">
        <table className="min-w-full text-[15px]">
          <thead>
            <tr className="bg-muted/70 text-xs font-semibold uppercase tracking-wide">
              <th className="p-3"></th>
              <th className="p-3">Code</th>
              <th className="p-3">Make</th>
              <th className="p-3">Model</th>
              <th className="p-3">Doors</th>
              <th className="p-3">Passengers</th>
              <th className="p-3">Bags</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {companyCarClasses.length > 0 ? (
              companyCarClasses.map((cl) => (
                <tr key={cl.id} className="border-b border-muted/50">
                  <td className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-primary/15"
                      onClick={() => {
                        if (canOperate) {
                          setEditing(cl);
                          setDialogOpen(true);
                        } else {
                          toast.error('Company and Location required');
                        }
                      }}
                      aria-label="Edit Car Class"
                      disabled={!canOperate}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </td>
                  <td className="text-center text-primary">
                    {cl.carClass?.slug || cl.carClass?.name}
                  </td>
                  <td className="text-center">{cl.make}</td>
                  <td className="text-center">{cl.model}</td>
                  <td className="text-center">{cl.numberOfDoors}</td>
                  <td className="text-center">{cl.numberOfPassengers}</td>
                  <td className="text-center">{cl.numberOfBags}</td>
                  <td className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => {
                        setPendingDelete(cl);
                        setDeleteDialogOpen(true);
                      }}
                      aria-label="Delete Car Class"
                      disabled={!canOperate}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="h-24 text-center text-muted-foreground text-lg">
                  <span>No car classes found. Click <b>Add Car Class</b> to get started.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CarClassDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={handleSave}
        onDelete={editing ? () => {
          setDialogOpen(false);
          setPendingDelete(editing);
          setDeleteDialogOpen(true);
        } : undefined}
        editing={editing}
        allCarClasses={allCarClasses}
      />

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-card rounded-2xl p-6 shadow-lg border max-w-sm w-full">
            <div className="font-bold text-lg mb-4 text-destructive">Confirm Delete</div>
            <div className="mb-6">
              Are you sure you want to delete
              <span className="font-bold ml-1">{pendingDelete?.carClass?.slug || pendingDelete?.carClass?.name}</span>
              ?
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setDeleteDialogOpen(false);
                setPendingDelete(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}