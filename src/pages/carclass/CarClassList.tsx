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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetchData, usePostData, useDeleteData } from '@/hooks/useApi';
import { axiosInstance } from '@/lib/API';
import { Car, CheckCircle2, XCircle, Search, Trash2, Plus } from 'lucide-react';

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

// Category badge color mapping based on size code
const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'E': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Economy' },
  'X': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Special' },
  'L': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Luxury' },
  'F': { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Full Size' },
  'S': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Standard' },
  'I': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'SUV' },
  'M': { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Mini' },
  'C': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Compact' },
  'P': { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Premium' },
  'V': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Van' },
};

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

const DEBOUNCE_MS = 700;
const ITEMS_PER_PAGE = 8;

const CarClassList = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [toggleLock, setToggleLock] = useState<{ [slug: string]: boolean }>({});
  const debounceTimers = useRef<{ [slug: string]: NodeJS.Timeout }>({});

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filter and search logic
  const filteredClasses = useMemo(() => {
    let result = carClasses;

    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(c => c.isActive);
    } else if (statusFilter === 'inactive') {
      result = result.filter(c => !c.isActive);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [carClasses, statusFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClasses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClasses, currentPage]);

  // Stats
  const totalClasses = carClasses.length;
  const activeClasses = carClasses.filter(c => c.isActive).length;
  const inactiveClasses = carClasses.filter(c => !c.isActive).length;

  // Reset page when filter changes
  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Get category info from ACRISS code
  const getCategoryFromCode = (code: string) => {
    const sizeCode = code.charAt(0);
    return CATEGORY_COLORS[sizeCode] || { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Other' };
  };

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

  // --- Toggle Status ---
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
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Car Classes Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure and manage ACRISS vehicle classifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Classes */}
        <Card className="p-5 bg-card border border-amber-200 dark:border-amber-900/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Classes</p>
              <p className="text-3xl font-bold text-foreground mt-1">{totalClasses}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Car className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        {/* Total Active Classes */}
        <Card className="p-5 bg-card border border-emerald-200 dark:border-emerald-900/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Active Classes</p>
              <p className="text-3xl font-bold text-foreground mt-1">{activeClasses}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        {/* Total Inactive Classes */}
        <Card className="p-5 bg-card border border-red-200 dark:border-red-900/50 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Inactive Classes</p>
              <p className="text-3xl font-bold text-foreground mt-1">{inactiveClasses}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-muted/50 border-border focus:bg-background"
            />
          </div>

          {/* Filter Buttons and Add Button */}
          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleFilterChange('inactive')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Add Button */}
            <Button
              onClick={() => setAddModalOpen(true)}
              className="bg-[#FE6603] hover:bg-orange-600 text-white font-medium px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Class
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  ACRISS Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedClasses.length > 0 ? (
                paginatedClasses.map((row) => {
                  const category = getCategoryFromCode(row.name);
                  return (
                    <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Switch
                          checked={row.isActive}
                          onCheckedChange={() => handleToggleStatus(row.slug, row.isActive)}
                          disabled={isToggling === row.slug || !!toggleLock[row.slug]}
                          className="data-[state=checked]:bg-[#00C950]"
                        />
                      </td>

                      {/* ACRISS Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-[#D08700]">
                          {row.name}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700">{row.description}</span>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${category.bg} ${category.text}`}>
                          {category.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openDeleteDialog(row.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No car classes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredClasses.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{paginatedClasses.length}</span> of{' '}
              <span className="font-medium text-foreground">{filteredClasses.length}</span> classes
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-gray-600"
              >
                Previous
              </Button>

              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-600'}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="text-muted-foreground"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* --- Add Car Class Dialog --- */}
      <Dialog open={addModalOpen} onOpenChange={open => { setAddModalOpen(open); if (!open) addReset(); }}>
        <DialogContent className="max-w-[518px] max-h-[518px] p-10" style={{ fontFamily: 'Poppins' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" style={{ fontFamily: 'Poppins' }}>Create New Car Class</DialogTitle>
          </DialogHeader>

          <form onSubmit={addHandleSubmit(onAddSubmit)} className="space-y-6">
            {/* Row 1: Size, Body, Trans, Fuel */}
            <div className="grid grid-cols-4 gap-3" style={{ fontFamily: 'Poppins' }}>
              <div className="space-y-1">
                <Label className="text-sm">Size</Label>
                <Select
                  value={size}
                  onValueChange={(val) => addSetValue('size', val, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-9">
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
                {addErrors.size && <p className="text-xs text-red-500 mt-1">{addErrors.size.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Body</Label>
                <Select
                  value={body}
                  onValueChange={(val) => addSetValue('body', val, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-9">
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
                {addErrors.body && <p className="text-xs text-red-500 mt-1">{addErrors.body.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Trans</Label>
                <Select
                  value={transmission}
                  onValueChange={(val) => addSetValue('transmission', val, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-9">
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
                {addErrors.transmission && <p className="text-xs text-red-500 mt-1">{addErrors.transmission.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Fuel</Label>
                <Select
                  value={fuel}
                  onValueChange={(val) => addSetValue('fuel', val, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-9">
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
                {addErrors.fuel && <p className="text-xs text-red-500 mt-1">{addErrors.fuel.message}</p>}
              </div>
            </div>

            {/* Category Display as Chips with Remove Button */}
            <div>
              <Label className="text-sm font-medium mb-1 block">Category</Label>
              <div className="flex flex-wrap items-center gap-2 bg-background border border-input rounded-lg px-3 py-2 min-h-[36px]">
                {size && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                    {VEHICLE_SIZES.find(s => s.code === size)?.name || size}
                    <button
                      type="button"
                      onClick={() => addSetValue('size', '', { shouldValidate: true })}
                      className="ml-1.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                {body && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                    {BODY_TYPES.find(b => b.code === body)?.name || body}
                    <button
                      type="button"
                      onClick={() => addSetValue('body', '', { shouldValidate: true })}
                      className="ml-1.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                {transmission && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full">
                    {TRANSMISSION_TYPES.find(t => t.code === transmission)?.name || transmission}
                    <button
                      type="button"
                      onClick={() => addSetValue('transmission', '', { shouldValidate: true })}
                      className="ml-1.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                {fuel && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-full">
                    {FUEL_TYPES.find(f => f.code === fuel)?.name || fuel}
                    <button
                      type="button"
                      onClick={() => addSetValue('fuel', '', { shouldValidate: true })}
                      className="ml-1.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                    >
                      <span className="text-xs font-bold">×</span>
                    </button>
                  </span>
                )}
                {!size && !body && !transmission && !fuel && (
                  <span className="text-sm text-muted-foreground">Select options above</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium mb-1 block">Description</Label>
              <input
                id="description"
                type="text"
                placeholder="Enter description (e.g., Economy Car)"
                {...register('description')}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {addErrors.description && <p className="text-xs text-red-500 mt-1">{addErrors.description.message}</p>}
            </div>

            {/* ACRISS Code */}
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">ACRISS Code:</Label>
                <Badge variant="secondary" className="font-mono text-lg bg-background border border-border px-3 py-1">
                  {acrissCode.replace(/_/g, '') || '____'}
                </Badge>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-x-5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={addSubmitting}
                className="px-4 py-2 text-sm w-52"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!addValid || addSubmitting || isCreating}
                className="px-4 py-2 text-sm w-52 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {addSubmitting || isCreating ? 'Creating...' : 'Create Car Class'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog --- */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className='text-center'>Delete Car Class</DialogTitle>
          </DialogHeader>
          <div>
            <p className="mb-2 text-sm text-muted-foreground text-center">
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
              className='w-40'
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCarClass}
              disabled={isDeleting}
              className='w-40'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarClassList;
