// src/pages/products/Products.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useFetchData, usePostData } from '@/hooks/useApi';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { useAppSelector } from '@/store';

type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  lat?: string;
  lng?: string;
  additionalInfo?: string;
};

type Product = {
  id: string;
  vin: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  isAvailable: boolean;
  description: string;
  addresses: Address[];
  make?: string;
  model?: string;
  year?: string;
};

const ProductsTable: React.FC = () => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vin, setVin] = useState('');
  const [vinData, setVinData] = useState<any>(null);
  const [isVinLoading, setIsVinLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmationName, setConfirmationName] = useState('');
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    vin: '',
    title: '',
    categoryName: '',
    subCategoryName: '',
    dailyPrice: 0,
    weeklyPrice: 0,
    monthlyPrice: 0,
    isAvailable: true,
    description: '',
    addresses: [
      {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        lat: '',
        lng: '',
        additionalInfo: ''
      }
    ],
  });

  // Fetch products
  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useFetchData(
    `/product/operator/63074a56-0697-496b-9558-8e1a1c759fd6?search=${searchTerm}`,
    'products'
  );

  const productList = productsData?.data || [];

  // Mutation for adding new product
  const { mutate: addProduct } = usePostData<any, Omit<Product, 'id'>>('/product/create');

  // Handle VIN lookup
  const handleVinLookup = async () => {
    if (!vin || vin.length !== 17) {
      toast.error('Please enter a valid 17-character VIN');
      return;
    }

    setIsVinLoading(true);
    try {
      const response = await fetch(`https://api.api-ninjas.com/v1/vinlookup?vin=${vin}`, {
        headers: {
          'X-Api-Key': 'iEM+t/Nztx1u+5St4uKxZw==LTzqJWTdK8VebIL3',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch VIN data');
      }

      const data = await response.json();
      setVinData(data);
      
      // Split class into category and subcategory
      const [categoryName, subCategoryName] = data.class ? 
        data.class.split('/').map((item: string) => item.trim()) : 
        ['', ''];
      
      // Auto-fill product fields from VIN data
      setNewProduct(prev => ({
        ...prev,
        vin: data.vin,
        title: `${data.manufacturer || ''} ${data.model || ''}`.trim(),
        make: data.manufacturer,
        model: data.model,
        year: data.year,
        categoryName,
        subCategoryName,
      }));
      
      toast.success('VIN data fetched successfully');
    } catch (error) {
      console.error('VIN lookup error:', error);
      toast.error('Failed to fetch VIN data');
    } finally {
      setIsVinLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle address field changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Address) => {
    const { value } = e.target;
    
    setNewProduct(prev => ({
      ...prev,
      addresses: [
        {
          ...prev.addresses[0],
          [field]: value
        }
      ]
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.vin || newProduct.vin.length !== 17) {
      toast.error('Please enter a valid VIN');
      return;
    }

    addProduct(newProduct, {
      onSuccess: () => {
        toast.success('Product added successfully');
        refetchProducts();
        setOpenAddDialog(false);
        setNewProduct({
          vin: '',
          title: '',
          categoryName: '',
          subCategoryName: '',
          dailyPrice: 0,
          weeklyPrice: 0,
          monthlyPrice: 0,
          isAvailable: true,
          description: '',
          addresses: [
            {
              street: '',
              city: '',
              state: '',
              country: '',
              zipCode: '',
              lat: '',
              lng: '',
              additionalInfo: ''
            }
          ],
        });
        setVinData(null);
      },
      onError: (error) => {
        console.error('Add product error:', error);
        toast.error('Failed to add product');
      },
    });
  };

  const handleDeleteOpen = (product: Product) => {
    setSelectedProduct(product);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setConfirmationName('');
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    if (confirmationName === selectedProduct.title) {
      // TODO: Implement delete functionality
      toast.success('Product was deleted');
      setOpenDeleteDialog(false);
      setConfirmationName('');
      refetchProducts();
    } else {
      toast.error("The name doesn't match. Product was not deleted.");
    }
  };

  if (isProductsLoading) {
    return <div className="p-4">Loading products...</div>;
  }

  if (productsError) {
    return <div className="p-4 text-destructive">Error loading products</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">All Products</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          {/* Only show Add Product button for operators */}
          {role === 'operator' && (
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill in the product details. The VIN field will auto-fill some information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="vin"
                        name="vin"
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                        placeholder="Enter 17-character VIN"
                        maxLength={17}
                      />
                      <Button
                        type="button"
                        onClick={handleVinLookup}
                        disabled={isVinLoading || vin.length !== 17}
                      >
                        {isVinLoading ? 'Loading...' : 'Lookup'}
                      </Button>
                    </div>
                  </div>
                  {vinData && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">VIN Details</p>
                      <div className="text-sm text-muted-foreground">
                        {vinData.manufacturer} {vinData.model} ({vinData.year})
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={newProduct.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category</Label>
                    <Input
                      id="categoryName"
                      name="categoryName"
                      value={newProduct.categoryName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subCategoryName">Subcategory</Label>
                    <Input
                      id="subCategoryName"
                      name="subCategoryName"
                      value={newProduct.subCategoryName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyPrice">Daily Price</Label>
                    <Input
                      id="dailyPrice"
                      name="dailyPrice"
                      type="number"
                      value={newProduct.dailyPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeklyPrice">Weekly Price</Label>
                    <Input
                      id="weeklyPrice"
                      name="weeklyPrice"
                      type="number"
                      value={newProduct.weeklyPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Monthly Price</Label>
                    <Input
                      id="monthlyPrice"
                      name="monthlyPrice"
                      type="number"
                      value={newProduct.monthlyPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Address</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input
                        id="street"
                        value={newProduct.addresses[0].street}
                        onChange={(e) => handleAddressChange(e, 'street')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newProduct.addresses[0].city}
                        onChange={(e) => handleAddressChange(e, 'city')}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={newProduct.addresses[0].state}
                        onChange={(e) => handleAddressChange(e, 'state')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={newProduct.addresses[0].country}
                        onChange={(e) => handleAddressChange(e, 'country')}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={newProduct.addresses[0].zipCode}
                        onChange={(e) => handleAddressChange(e, 'zipCode')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo">Additional Info</Label>
                      <Input
                        id="additionalInfo"
                        value={newProduct.addresses[0].additionalInfo || ''}
                        onChange={(e) => handleAddressChange(e, 'additionalInfo')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="isAvailable"
                    name="isAvailable"
                    type="checkbox"
                    checked={newProduct.isAvailable}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isAvailable">Available for rent</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Product</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>VIN</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Daily Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.length > 0 ? (
              productList.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.vin}</TableCell>
                  <TableCell>{product.title}</TableCell>
                  <TableCell>{product.categoryName}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(product.dailyPrice)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isAvailable}
                        onCheckedChange={() => {
                          setSelectedProduct(product);
                          // TODO: Implement status change functionality
                        }}
                      />
                      <span className="text-sm">
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setOpenDetail(true);
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive border-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteOpen(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>VIN Number</Label>
                <p>{selectedProduct.vin}</p>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <p>{selectedProduct.title}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p>{selectedProduct.categoryName}</p>
                  </div>
                </div>

                {selectedProduct.subCategoryName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subcategory</Label>
                      <p>{selectedProduct.subCategoryName}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Daily Price</Label>
                    <p>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedProduct.dailyPrice)}
                    </p>
                  </div>
                  <div>
                    <Label>Weekly Price</Label>
                    <p>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedProduct.weeklyPrice)}
                    </p>
                  </div>
                  <div>
                    <Label>Monthly Price</Label>
                    <p>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(selectedProduct.monthlyPrice)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <p>{selectedProduct.description || 'N/A'}</p>
                </div>

                <div>
                  <Label>Address</Label>
                  {selectedProduct.addresses && selectedProduct.addresses.length > 0 && (
                    <div className="space-y-2">
                      <p>{selectedProduct.addresses[0].street}</p>
                      <p>{selectedProduct.addresses[0].city}, {selectedProduct.addresses[0].state} {selectedProduct.addresses[0].zipCode}</p>
                      <p>{selectedProduct.addresses[0].country}</p>
                      {selectedProduct.addresses[0].additionalInfo && (
                        <p className="text-muted-foreground">{selectedProduct.addresses[0].additionalInfo}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  <p>{selectedProduct.isAvailable ? 'Available' : 'Unavailable'}</p>
                </div>

                {selectedProduct.make && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Make</Label>
                      <p>{selectedProduct.make}</p>
                    </div>
                    <div>
                      <Label>Model</Label>
                      <p>{selectedProduct.model}</p>
                    </div>
                  </div>
                )}

                {selectedProduct.year && (
                  <div>
                    <Label>Year</Label>
                    <p>{selectedProduct.year}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type <span className="font-semibold">"{selectedProduct?.title || ''}"</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmationName" className="text-right">
                Name
              </Label>
              <Input
                id="confirmationName"
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsTable;