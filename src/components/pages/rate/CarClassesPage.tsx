'use client';

// src/pages/rate/CarClassesPage.tsx
import * as React from 'react';
import { useParams } from '@/hooks/useNextNavigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pencil,
  Trash2,
  PlusCircle,
  Search,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import CarClassDialog from '@/components/CarClasses/CarClassDialog';
import {
  useFetchData,
  usePostData,
  usePutData,
  useDeleteData,
} from '@/hooks/useOperatorCarClass';
import { useAppSelector } from '@/store';
import { apiClient } from '@/api/client';

interface CarClassAPI {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CarImage {
  id: string;
  url: string;
  sortOrder: number;
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
  images?: CarImage[];
}

export default function CarClassesPage() {
  const { locationId } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((state) => state.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(locationId) && Boolean(companyId);

  const { data: allCarClasses = [] } = useFetchData<CarClassAPI[]>(
    'car-class/filter-car-classes',
    ['car-class-filter'],
  );

  const { data: companyCarClasses = [], refetch } = useFetchData<
    CompanyCarClass[]
  >(canOperate ? `company-car-class/${companyId}/${locationId}` : '', [
    'company-car-classes',
    companyId,
    locationId || '',
  ]);

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
        toast.error(
          error?.response?.data?.message || 'Failed to add car class',
        );
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
        toast.error(
          error?.response?.data?.message || 'Failed to update car class',
        );
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
      toast.error(
        error?.response?.data?.message || 'Failed to delete car class',
      );
    },
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompanyCarClass | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] =
    React.useState<CompanyCarClass | null>(null);
  const [editingWithImages, setEditingWithImages] =
    React.useState<CompanyCarClass | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCode, setFilterCode] = React.useState('all');

  // Function to fetch car class with images for editing
  const fetchCarClassWithImages = async (carClassId: string) => {
    try {
      const { data } = await apiClient.get(
        `company-car-class/${companyId}/${locationId}/${carClassId}`,
      );
      return data.data;
    } catch (error) {
      console.error('Error fetching car class with images:', error);
      return null;
    }
  };

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
      images: values.image, // The hook will handle FormData conversion
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
          endpoint: `company-car-class/${companyId}/${locationId}/${pendingDelete.id}`,
        });
        setDeleteDialogOpen(false);
        setPendingDelete(null);
      } catch (error) {
        console.error('Error deleting car class:', error);
      }
    }
  }

  // Get unique car codes for filter
  const uniqueCodes = React.useMemo(() => {
    const codes = new Set(
      companyCarClasses.map((c) => c.carClass?.slug || c.carClass?.name),
    );
    return Array.from(codes);
  }, [companyCarClasses]);

  // Filter car classes based on search and filter
  const filteredCarClasses = React.useMemo(() => {
    return companyCarClasses.filter((carClass) => {
      const code = carClass.carClass?.slug || carClass.carClass?.name || '';
      const matchesSearch =
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carClass.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carClass.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterCode === 'all' || code === filterCode;
      return matchesSearch && matchesFilter;
    });
  }, [companyCarClasses, searchQuery, filterCode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Car Classes</h1>
      </div>

      {/* Combined Filter + Table Card - Exact design match */}
      <div className="rounded-[20px] bg-white border border-gray-200 shadow-md overflow-hidden">
        {/* Search and Filter Bar with Add Button - Full width */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search Car Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg border-gray-300 h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Filter by Code:
            </span>
            <Select value={filterCode} onValueChange={setFilterCode}>
              <SelectTrigger className="w-[180px] rounded-lg border-gray-300 h-10">
                <SelectValue placeholder="All Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Code</SelectItem>
                {uniqueCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="rounded-lg border-gray-300 h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="gap-2 rounded-lg bg-[#F56304] hover:bg-[#e05503] text-white h-10 px-4"
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
            <PlusCircle className="h-4 w-4" />
            Add Car Class
          </Button>
        </div>

        {/* Table */}
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Car Code
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Make
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Model
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Doors
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Passengers
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Bags
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredCarClasses.length > 0 ? (
              filteredCarClasses.map((cl) => (
                <tr
                  key={cl.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[#F56304] text-sm">
                      {cl.carClass?.slug || cl.carClass?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{cl.make}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {cl.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {cl.numberOfDoors}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {cl.numberOfPassengers}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {cl.numberOfBags}
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                          disabled={!canOperate}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={async () => {
                            if (canOperate) {
                              setEditing(cl);
                              setDialogOpen(true);
                              const carClassWithImages =
                                await fetchCarClassWithImages(cl.id);
                              if (carClassWithImages) {
                                setEditingWithImages(carClassWithImages);
                              }
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPendingDelete(cl);
                            setDeleteDialogOpen(true);
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
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-muted-foreground text-sm"
                >
                  {searchQuery || filterCode !== 'all' ? (
                    <span>No car classes found matching your filters.</span>
                  ) : (
                    <span>
                      No car classes found. Click <b>Add Car Class</b> to get
                      started.
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* End of combined card */}

      <CarClassDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setEditingWithImages(null);
        }}
        onSave={handleSave}
        onDelete={
          editing
            ? () => {
                setDialogOpen(false);
                setPendingDelete(editing);
                setDeleteDialogOpen(true);
              }
            : undefined
        }
        editing={editingWithImages || editing}
        allCarClasses={allCarClasses}
      />

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-card rounded-2xl p-6 shadow-lg border max-w-sm w-full">
            <div className="font-bold text-lg mb-4 text-destructive">
              Confirm Delete
            </div>
            <div className="mb-6">
              Are you sure you want to delete
              <span className="font-bold ml-1">
                {pendingDelete?.carClass?.slug || pendingDelete?.carClass?.name}
              </span>
              ?
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setPendingDelete(null);
                }}
              >
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
