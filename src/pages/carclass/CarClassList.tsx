// src/pages/carclass/CarClassList.tsx
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
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';

// Mock data initialization
const initialMockData = [
  { id: uuidv4(), slug: 'mcar-1', enabled: true, carClassCode: 'MCAR' },
  { id: uuidv4(), slug: 'ecar-1', enabled: true, carClassCode: 'ECAR' },
  { id: uuidv4(), slug: 'ccar-1', enabled: false, carClassCode: 'CCAR' }
];

// ACRISS code options
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

// Schema validation
const carClassSchema = z.object({
  enabled: z.boolean().default(true),
  carClassCode: z.string().length(4, 'ACRISS code must be 4 characters'),
  size: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
  transmission: z.string().min(1, 'Required'),
  fuel: z.string().min(1, 'Required'),
});

type CarClassFormValues = z.infer<typeof carClassSchema>;

const CarClassList = () => {
  const [mockData, setMockData] = useState(initialMockData);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const {
    handleSubmit: addHandleSubmit,
    reset: addReset,
    setValue: addSetValue,
    watch: addWatch,
    formState: { errors: addErrors, isValid: addValid, isSubmitting: addSubmitting },
  } = useForm<CarClassFormValues>({
    resolver: zodResolver(carClassSchema),
    mode: 'onChange',
    defaultValues: {
      enabled: true,
      carClassCode: '',
      size: '',
      body: '',
      transmission: '',
      fuel: '',
    },
  });

  // Update full ACRISS code when components change
  const size = addWatch('size');
  const body = addWatch('body');
  const transmission = addWatch('transmission');
  const fuel = addWatch('fuel');

  useEffect(() => {
    const code = `${size}${body}${transmission}${fuel}`;
    addSetValue('carClassCode', code, { shouldValidate: true });
  }, [size, body, transmission, fuel, addSetValue]);

  const onAddSubmit = (data: CarClassFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      const newCarClass = {
        id: uuidv4(),
        slug: `${data.carClassCode.toLowerCase()}-${Math.floor(Math.random() * 100)}`,
        enabled: data.enabled,
        carClassCode: data.carClassCode,
      };
      setMockData([...mockData, newCarClass]);
      toast.success('Car class created!');
      setAddModalOpen(false);
      addReset();
      setIsLoading(false);
    }, 500);
  };

  const handleDelete = () => {
    if (!deleteSlug) return;
    setIsLoading(true);
    setTimeout(() => {
      setMockData(mockData.filter(item => item.slug !== deleteSlug));
      toast.success('Car class deleted!');
      setDeleteSlug(null);
      setIsLoading(false);
    }, 500);
  };

  const handleToggleStatus = (id: string, checked: boolean) => {
    const updatedData = mockData.map(item =>
      item.id === id ? { ...item, enabled: checked } : item
    );
    setMockData(updatedData);
    toast.success(`Car class ${checked ? 'enabled' : 'disabled'}`);
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
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockData.map((row) => (
              <tr key={row.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(checked) => handleToggleStatus(row.id, checked)}
                      className="mr-2"
                    />
                    <span className={row.enabled ? 'text-green-600' : 'text-gray-500'}>
                      {row.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Badge variant="outline" className="font-mono mr-2">
                      {row.carClassCode}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteSlug(row.slug)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {!mockData.length && !isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-muted-foreground">
                  No car classes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSlug} onOpenChange={open => !open && setDeleteSlug(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this car class? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSlug(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Car Class Dialog */}
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
                  value={addWatch('size')}
                  onValueChange={(val) => addSetValue('size', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_SIZES.map((size) => (
                      <SelectItem key={size.code} value={size.code}>
                        {size.code} - {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.size && <p className="text-xs text-red-500">{addErrors.size.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Select
                  value={addWatch('body')}
                  onValueChange={(val) => addSetValue('body', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map((body) => (
                      <SelectItem key={body.code} value={body.code}>
                        {body.code} - {body.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.body && <p className="text-xs text-red-500">{addErrors.body.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">Trans</Label>
                <Select
                  value={addWatch('transmission')}
                  onValueChange={(val) => addSetValue('transmission', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_TYPES.map((trans) => (
                      <SelectItem key={trans.code} value={trans.code}>
                        {trans.code} - {trans.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.transmission && <p className="text-xs text-red-500">{addErrors.transmission.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel">Fuel</Label>
                <Select
                  value={addWatch('fuel')}
                  onValueChange={(val) => addSetValue('fuel', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((fuel) => (
                      <SelectItem key={fuel.code} value={fuel.code}>
                        {fuel.code} - {fuel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addErrors.fuel && <p className="text-xs text-red-500">{addErrors.fuel.message}</p>}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>ACRISS Code:</Label>
                <Badge variant="secondary" className="font-mono text-lg">
                  {addWatch('carClassCode') || '____'}
                </Badge>
              </div>
              {addErrors.carClassCode && (
                <p className="text-xs text-red-500 mt-1">{addErrors.carClassCode.message}</p>
              )}
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
                disabled={!addValid || addSubmitting}
              >
                {addSubmitting ? 'Creating...' : 'Create Car Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CarClassList;