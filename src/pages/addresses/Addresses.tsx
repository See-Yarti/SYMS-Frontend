// src/pages/addresses/Addresses.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/API';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Edit, Plus, Loader2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Types
type Address = {
  id: string;
  addressLabel: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  postalCode: string;
  lat: string;
  lng: string;
  additionalInfo: string;
  createdAt: string;
  updatedAt: string;
};

type AddressesResponse = {
  success: boolean;
  data: {
    addresses: Address[];
  };
};

type SingleAddressResponse = {
  success: boolean;
  data: {
    address: Address;
  };
};

// Form validation schema
const addressSchema = z.object({
  addressLabel: z.string().min(1, 'Label is required'),
  street: z.string().min(1, 'Street is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  postalCode: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const AddressesTable: React.FC<{ companyId: string }> = ({ companyId }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Fetch all addresses
  const { data: addressesData, isLoading } = useQuery<AddressesResponse>({
    queryKey: ['addresses', companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/address/get-all-addresses/${companyId}`);
      return data;
    },
  });

  // Fetch single address (used when editing)
  const { data: singleAddress } = useQuery<SingleAddressResponse>({
    queryKey: ['address', editingAddress?.id],
    queryFn: async () => {
      if (!editingAddress) throw new Error('No address ID');
      const { data } = await axiosInstance.get(`/address/get-address/${editingAddress.id}`);
      return data;
    },
    enabled: !!editingAddress?.id,
  });

  // Add/Edit address mutation
  const { mutate: saveAddress, isPending: isSaving } = useMutation({
    mutationFn: async (formData: AddressFormValues) => {
      const endpoint = editingAddress
        ? `/address/add-new-company-address/${companyId}`
        : `/address/add-new-company-address/${companyId}`;

      const method = editingAddress ? 'PATCH' : 'POST';

      const { data } = await axiosInstance({
        method,
        url: endpoint,
        data: formData,
      });
      return data;
    },
    onSuccess: () => {
      toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses', companyId] });
      setIsDialogOpen(false);
      setEditingAddress(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save address');
    },
  });

  // Delete address mutation
  const { mutate: deleteAddress, isPending: isDeleting } = useMutation({
    mutationFn: async (addressId: string) => {
      await axiosInstance.delete(`/address/delete-address/${addressId}`);
      return addressId;
    },
    onSuccess: (deletedId) => {
      toast.success('Address deleted successfully');
      queryClient.setQueryData(['addresses', companyId], (old: AddressesResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            addresses: old.data.addresses.filter(addr => addr.id !== deletedId),
          },
        };
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });

  // Form setup
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLabel: '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      postalCode: '',
      lat: '',
      lng: '',
      additionalInfo: '',
    },
  });

  // Set form values when editing
  React.useEffect(() => {
    if (singleAddress?.data?.address) {
      form.reset(singleAddress.data.address);
    }
  }, [singleAddress, form]);

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: AddressFormValues) => {
    saveAddress(data);
  };

  const addresses = addressesData?.data?.addresses || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Company Addresses</h2>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No addresses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {address.addressLabel}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {address.street}
                      {address.apartment && `, ${address.apartment}`}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(address)}
                      disabled={isDeleting}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAddress(address.id)}
                      disabled={isDeleting}
                      className="h-8 w-8 p-0"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">City:</span> {address.city}
                  </p>
                  <p>
                    <span className="font-medium">State:</span> {address.state}
                  </p>
                  <p>
                    <span className="font-medium">Country:</span> {address.country}
                  </p>
                  <p>
                    <span className="font-medium">Zip Code:</span> {address.zipCode}
                  </p>
                  {address.postalCode && (
                    <p>
                      <span className="font-medium">Postal Code:</span> {address.postalCode}
                    </p>
                  )}
                  {address.additionalInfo && (
                    <p className="mt-2">
                      <span className="font-medium">Additional Info:</span> {address.additionalInfo}
                    </p>
                  )}
                </div>
              </CardContent>
              {(address.lat || address.lng) && (
                <CardFooter className="text-xs text-muted-foreground">
                  Coordinates: {address.lat}, {address.lng}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLabel">Address Label*</Label>
                <Input
                  id="addressLabel"
                  placeholder="e.g., Head Office"
                  {...form.register('addressLabel')}
                />
                {form.formState.errors.addressLabel && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.addressLabel.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street*</Label>
                <Input
                  id="street"
                  placeholder="e.g., Sheikh Zayed Road"
                  {...form.register('street')}
                />
                {form.formState.errors.street && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.street.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apartment">Apartment/Suite</Label>
                <Input
                  id="apartment"
                  placeholder="e.g., Office 502"
                  {...form.register('apartment')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  placeholder="e.g., Dubai"
                  {...form.register('city')}
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State*</Label>
                <Input
                  id="state"
                  placeholder="e.g., Dubai"
                  {...form.register('state')}
                />
                {form.formState.errors.state && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country*</Label>
                <Input
                  id="country"
                  placeholder="e.g., UAE"
                  {...form.register('country')}
                />
                {form.formState.errors.country && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code*</Label>
                <Input
                  id="zipCode"
                  placeholder="e.g., 00000"
                  {...form.register('zipCode')}
                />
                {form.formState.errors.zipCode && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.zipCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="e.g., 12345"
                  {...form.register('postalCode')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  placeholder="e.g., 25.2048"
                  {...form.register('lat')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  placeholder="e.g., 55.2708"
                  {...form.register('lng')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Input
                id="additionalInfo"
                placeholder="Any special instructions"
                {...form.register('additionalInfo')}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingAddress ? (
                  'Update Address'
                ) : (
                  'Add Address'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressesTable;