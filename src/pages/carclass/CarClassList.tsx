import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetchData, usePostData, useDeleteData } from '@/hooks/useApi';
import { axiosInstance } from '@/lib/API';

const VEHICLE_SIZES = [
  { code: 'M', name: 'Mini' },
  { code: 'E', name: 'Economy' },
  { code: 'C', name: 'Compact' },
  { code: 'I', name: 'Intermediate' },
  { code: 'S', name: 'Standard' },
  { code: 'F', name: 'Full-size' },
  { code: 'P', name: 'Premium' },
  { code: 'L', name: 'Luxury' },
  { code: 'X', name: 'Special' },
];
const BODY_TYPES = [
  { code: 'C', name: 'Sedan/Hatchback' },
  { code: 'R', name: 'SUV' },
  { code: 'V', name: 'Van/MPV' },
  { code: 'W', name: 'Wagon' },
  { code: 'T', name: 'Convertible' },
  { code: 'P', name: 'Pickup Truck' },
  { code: 'E', name: 'Electric' },
];
const TRANSMISSION_TYPES = [
  { code: 'A', name: 'Automatic' },
  { code: 'M', name: 'Manual' },
  { code: 'B', name: 'AWD/Auto' },
  { code: 'D', name: '4WD/Manual' },
];
const FUEL_TYPES = [
  { code: 'R', name: 'Petrol+AC' },
  { code: 'N', name: 'Petrol' },
  { code: 'D', name: 'Diesel' },
  { code: 'E', name: 'Electric' },
  { code: 'H', name: 'Hybrid' },
  { code: 'L', name: 'CNG/LPG' },
];

const carClassSchema = z.object({
  size: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
  transmission: z.string().min(1, 'Required'),
  fuel: z.string().min(1, 'Required'),
  description: z.string().max(255).optional(),
});
type CarClassFormValues = z.infer<typeof carClassSchema>;

interface CarClassAPIType {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEBOUNCE_MS = 700; // 0.7s debounce for toggling

const CarClassList = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [toggleLock, setToggleLock] = useState<{ [slug: string]: boolean }>({});
  const debounceTimers = useRef<{ [slug: string]: NodeJS.Timeout }>({});

  // --- DELETE STATE ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { mutateAsync: deleteCarClass, isPending: isDeleting } = useDeleteData({
    onSuccess: async () => {
      toast.success('Car class deleted!');
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      await refetch();
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to delete car class';
      toast.error(errorMsg);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      console.error('Delete error', error);
    },
  });

  const confirmDeleteCarClass = async () => {
    if (!deleteTargetId) return;
    await deleteCarClass({ endpoint: `car-class/id/${deleteTargetId}` });
  };

  const openDeleteDialog = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const cancelDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const {
    handleSubmit: addHandleSubmit,
    reset: addReset,
    setValue: addSetValue,
    watch: addWatch,
    register,
    formState: { errors: addErrors, isValid: addValid, isSubmitting: addSubmitting },
  } = useForm<CarClassFormValues>({
    resolver: zodResolver(carClassSchema),
    mode: 'onChange',
    defaultValues: {
      size: '',
      body: '',
      transmission: '',
      fuel: '',
      description: '',
    },
  });

  const size = addWatch('size');
  const body = addWatch('body');
  const transmission = addWatch('transmission');
  const fuel = addWatch('fuel');
  const acrissCode = `${size || '_'}${body || '_'}${transmission || '_'}${fuel || '_'}`;

  // *** SHOW TOAST FOR 429s ON FETCH/GET ***
  const { data: carClasses = [], isLoading, refetch } = useFetchData<CarClassAPIType[]>(
    'car-class',
    ['car-classes'],
    {
      staleTime: 0,
      onError: (err: any) => {
        if (err?.response?.status === 429) {
          toast.error('You are sending requests too quickly. Please wait and try again.');
        } else {
          toast.error('Failed to load car classes.');
        }
        console.error('Fetch car classes error:', err);
      }
    }
  );

  // --- Add / Create Car Class ---
  const { mutateAsync: createCarClass, isPending: isCreating } = usePostData<any, any>(
    'car-class',
    {
      onSuccess: async () => {
        toast.success('Car class created!');
        setAddModalOpen(false);
        addReset();
        await refetch();
      },
      onError: (error: any) => {
        console.error('Add error', error);
        if (error?.response?.status === 429) {
          toast.error('You are sending requests too quickly. Please slow down and try again.');
        } else {
          toast.error('Failed to create car class');
        }
      },
    }
  );

  const onAddSubmit = async (data: CarClassFormValues) => {
    const postBody = {
      name: `${data.size}${data.body}${data.transmission}${data.fuel}`,
      description: data.description || `${data.size} ${data.body} ${data.transmission} ${data.fuel}`,
    };
    await createCarClass(postBody);
  };

  // --- Toggle Status (with 429 error handling and lockout) ---
  const handleToggleStatus = (slug: string, currentActive: boolean) => {
    if (toggleLock[slug]) {
      toast.warning('You are toggling too quickly. Please wait a moment.');
      return;
    }
    setIsToggling(slug);

    if (debounceTimers.current[slug]) {
      clearTimeout(debounceTimers.current[slug]);
    }
    debounceTimers.current[slug] = setTimeout(async () => {
      try {
        await axiosInstance.put(`car-class/active/slug/${slug}`);
        toast.success(`Car class ${!currentActive ? 'enabled' : 'disabled'}`);
        await refetch();
      } catch (err: any) {
        console.error('Toggle error', err);
        if (err?.response?.status === 429) {
          toast.error('You are sending requests too quickly. Please slow down and try again.');
          setToggleLock((prev) => ({ ...prev, [slug]: true }));
          setTimeout(() => setToggleLock((prev) => ({ ...prev, [slug]: false })), 2500);
        } else {
          toast.error('Failed to update status');
        }
      } finally {
        setIsToggling(null);
      }
    }, DEBOUNCE_MS);
  };

  return (
    <Card className="p-6 border-none shadow-none">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Car Classes</h2>
          <p className="text-sm text-muted-foreground">
            Manage vehicle classifications using ACRISS codes
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          + Add Car Class
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ACRISS Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : carClasses.length > 0 ? (
              carClasses.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Switch
                        checked={row.isActive}
                        onCheckedChange={() => handleToggleStatus(row.slug, row.isActive)}
                        disabled={isToggling === row.slug || !!toggleLock[row.slug]}
                        className="mr-2"
                      />
                      <span className={row.isActive ? 'text-green-600' : 'text-gray-500'}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Badge variant="outline" className="font-mono mr-2">
                        {row.name}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs">{row.description}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(row.id)}
                      disabled={isDeleting}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                  No car classes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Add Car Class Dialog --- */}
      <Dialog open={addModalOpen} onOpenChange={open => { setAddModalOpen(open); if (!open) addReset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Car Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={addHandleSubmit(onAddSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={size}
                  onValueChange={(val) => addSetValue('size', val, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_SIZES.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.code} - {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.size && <p className="text-xs text-red-500">{addErrors.size.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Select
                  value={body}
                  onValueChange={(val) => addSetValue('body', val, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.code} - {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.body && <p className="text-xs text-red-500">{addErrors.body.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transmission">Trans</Label>
                <Select
                  value={transmission}
                  onValueChange={(val) => addSetValue('transmission', val, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_TYPES.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.code} - {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.transmission && <p className="text-xs text-red-500">{addErrors.transmission.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel">Fuel</Label>
                <Select
                  value={fuel}
                  onValueChange={(val) => addSetValue('fuel', val, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.code} - {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.fuel && <p className="text-xs text-red-500">{addErrors.fuel.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <input
                id="description"
                type="text"
                placeholder="Describe this class (optional)"
                {...register('description')}
                className="input border rounded w-full px-3 py-2 mt-1 text-sm"
              />
              {addErrors.description && <p className="text-xs text-red-500">{addErrors.description.message}</p>}
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>ACRISS Code:</Label>
                <Badge variant="secondary" className="font-mono text-lg">
                  {acrissCode}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={addSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!addValid || addSubmitting || isCreating}
              >
                {addSubmitting || isCreating ? 'Creating...' : 'Create Car Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog --- */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Car Class</DialogTitle>
          </DialogHeader>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Are you sure you want to delete this car class? <br />
              <strong>This action cannot be undone.</strong>
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCarClass}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CarClassList;
