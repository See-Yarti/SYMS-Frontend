// src/pages/addresses/Addresses.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import { useAppSelector } from '@/store';
import { selectCompanyId } from '@/store/features/auth.slice';
import { useFetchData, usePostData, useDeleteData } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const formSchema = z.object({
  addressLabel: z.string().min(1, 'Address label is required'),
  street: z.string().min(1, 'Street is required'),
  apartment: z.string().min(1, 'Apartment/suite is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  zipCode: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  additionalInfo: z.string().optional(),
});

type AddressFormValues = z.infer<typeof formSchema>;

interface Address {
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
}

const Addresses = () => {
  const companyId = useAppSelector(selectCompanyId);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [addressToDelete, setAddressToDelete] = useState<string>('');
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      addressLabel: '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      postalCode: '',
      additionalInfo: '',
    },
  });

  // Fetch addresses
  const {
    data: addressesData,
    isLoading: isLoadingAddresses,
    refetch: refetchAddresses
  } = useFetchData<{
    addresses: Address[];
  }>(`/address/get-all-addresses/${companyId ?? ''}`, ['addresses', companyId ?? '']);

  // Add/update address mutation
  const { mutate: addUpdateAddress, isPending: isSubmitting } = usePostData<
    AddressFormValues,
    { message: string }
  >(`/address/add-new-company-address/${companyId}`, {
    onSuccess: () => {
      toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully');
      refetchAddresses();
      handleCloseModal();
    },
    onError: (error: { message: any; }) => {
      toast.error(error.message || 'Failed to save address');
    }
  });

  // Delete address mutation
  const { mutate: deleteAddress } = useDeleteData({
    onSuccess: () => {
      toast.success('Address deleted successfully');
      refetchAddresses();
      setIsDeleteDialogOpen(false);
    },
    onError: (error: { message: any; }) => {
      toast.error(error.message || 'Failed to delete address');
    }
  });

  useEffect(() => {
    if (!companyId) {
      navigate('/login');
    }
  }, [companyId, navigate]);

 const handleOpenModal = () => {
  setEditingAddress(null);            
  form.reset({                        
    addressLabel: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    postalCode: '',
    additionalInfo: '',
  });
  setSelectedCountry('');
  setSelectedState('');
  setIsModalOpen(true);
};


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    form.reset();
    setSelectedCountry('');
    setSelectedState('');
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setSelectedCountry(address.country);
    setSelectedState(address.state);
    form.reset({
      ...address,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (addressId: string) => {
    setAddressToDelete(addressId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!addressToDelete) return;
    deleteAddress(`/address/delete-address/${addressToDelete}` as any);
  };

  const onSubmit = (values: AddressFormValues) => {
    addUpdateAddress(values);
  };

  const countryData = Country.getAllCountries().map((country) => ({
    label: country.name,
    value: country.isoCode,
  }));

  const stateData = selectedCountry
    ? State.getStatesOfCountry(selectedCountry).map((state) => ({
      label: state.name,
      value: state.isoCode,
    }))
    : [];

  const cityData = selectedState
    ? City.getCitiesOfState(selectedCountry, selectedState).map((city) => ({
      label: city.name,
      value: city.name,
    }))
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Company Addresses</h1>
        <Button onClick={handleOpenModal}>
          Add New Address
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Address List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAddresses ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading addresses...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Additional Info</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addressesData?.addresses?.length ? (
                  addressesData.addresses.map((address) => (
                    <TableRow key={address.id}>
                      <TableCell>
                        <Badge variant="outline">{address.addressLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{address.street}, {address.apartment}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state}, {address.country}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Postal: {address.postalCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {address.additionalInfo}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(address)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(address.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No addresses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="addressLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Head Office, Branch Office" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartment/Suite</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartment, suite, unit, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCountry(value);
                          form.setValue('state', '');
                          form.setValue('city', '');
                          setSelectedState('');
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countryData.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedState(value);
                          form.setValue('city', '');
                        }}
                        value={field.value}
                        disabled={!selectedCountry}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state/province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stateData.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedState}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cityData.map((city) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Zip code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information or landmarks"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

}; export default Addresses;