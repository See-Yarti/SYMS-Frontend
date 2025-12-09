// src/components/Company/CompanyList.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVerifyCompany, useUnverifyCompany, useGetCompanies, useDeleteCompany, useUpdateCompany } from '@/hooks/useCompanyApi';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Loader2, Eye, CheckCircle2, XCircle, Trash2, MoreVertical, Pencil,
    Building2, TrendingUp, Search, Plus, ShieldCheck, ShieldX, ShieldAlert
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type SortOrder = 'ASC' | 'DESC';

// Update company schema
const updateCompanySchema = z.object({
    name: z.string().min(1, { message: 'Company name is required' }).max(100, { message: 'Company name must be less than 100 characters' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }).max(500, { message: 'Description must be less than 500 characters' }),
    tradeLicenseExpiryDate: z.string().min(1, { message: 'Expiry date is required' }),
});

type UpdateCompanyFormValues = z.infer<typeof updateCompanySchema>;

const getInitials = (name?: string) => {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

// Generate random avatar color based on name
const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-gray-400';
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-red-500',
        'bg-orange-500',
        'bg-teal-500',
        'bg-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

export default function CompaniesList() {
    const navigate = useNavigate();

    // Filters & table state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'not_verified'>('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [page, setPage] = useState(1);
    const [limit] = useState(8);

    // Data
    const { data, isLoading, error, refetch } = useGetCompanies({
        search,
        isVerified: statusFilter === 'all' ? undefined : statusFilter === 'verified',
        sortBy,
        sortOrder,
        page,
        limit,
    });

    // Separate call for stats - get ALL companies without pagination for accurate counts
    const { data: statsData, refetch: refetchStats } = useGetCompanies({
        page: 1,
        limit: 1000, 
        sortBy: 'createdAt',
        sortOrder: 'DESC',
    });

    // Combined refetch function
    const refetchAll = () => {
        refetch();
        refetchStats();
    };

    const companies = useMemo(
        () => (data?.data?.companies ?? []),
        [data]
    );

    // Stats calculation
    const stats = useMemo(() => {
        const allCompanies = statsData?.data?.companies ?? [];
        const totalCount = statsData?.data?.total ?? allCompanies.length;
        const verifiedCount = allCompanies.filter((c: any) => c.isVerified).length;
        const unverifiedCount = allCompanies.filter((c: any) => !c.isVerified).length;
        const thisMonth = allCompanies.filter((c: any) => {
            const createdAt = new Date(c.createdAt);
            const now = new Date();
            return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
        }).length;

        return {
            total: totalCount,
            verified: verifiedCount,
            unverified: unverifiedCount,
            thisMonth,
        };
    }, [statsData]);

    // Pagination metadata
    const total = stats.total; const currentPage = data?.data?.page ?? page;
    const currentLimit = data?.data?.limit ?? limit;
    const totalPages = Math.ceil(total / currentLimit) || 1;

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, sortBy, sortOrder]);

    // Mutations
    const verifyCompany = useVerifyCompany();
    const unverifyCompany = useUnverifyCompany();
    const deleteCompany = useDeleteCompany();
    const updateCompany = useUpdateCompany();

    // Unverify dialog
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [unverifiedReason, setUnverifiedReason] = useState('');
    const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');

    // Delete dialog
    const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);

    // Update dialog
    const [updateCompanyId, setUpdateCompanyId] = useState<string | null>(null);
    const [updateCompanyData, setUpdateCompanyData] = useState<any>(null);
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<UpdateCompanyFormValues>({
        resolver: zodResolver(updateCompanySchema),
    });

    // Load company data when update dialog opens
    useEffect(() => {
        if (updateCompanyId && updateCompanyData) {
            setValue('name', updateCompanyData.name || '');
            setValue('description', updateCompanyData.description || '');
            setValue('tradeLicenseExpiryDate', updateCompanyData.tradeLicenseExpiryDate ? new Date(updateCompanyData.tradeLicenseExpiryDate).toISOString().split('T')[0] : '');
        }
    }, [updateCompanyId, updateCompanyData, setValue]);

    // Handle filter change
    const handleFilterChange = (filter: 'all' | 'verified' | 'not_verified') => {
        setStatusFilter(filter);
        setPage(1);
    };

    const canGoForward = companies.length === limit;

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Companies Management</h1>
                <p className="text-sm text-muted-foreground mt-1">View and manage all registered companies</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Companies */}
                <Card className="p-5 bg-card border border-blue-200 dark:border-blue-900/50 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-normal">Total Companies</p>
                            <p className="text-3xl font-medium text-foreground mt-1">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </Card>

                {/* Total Verified Companies */}
                <Card className="p-5 bg-card border border-green-200 dark:border-green-900/50 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-normal">Total Verified Companies</p>
                            <p className="text-3xl font-medium text-foreground mt-1">{stats.verified}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </Card>

                {/* Total Unverified Companies */}
                <Card className="p-5 bg-card border border-amber-200 dark:border-amber-900/50 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-normal">Total UnVerified Companies</p>
                            <p className="text-3xl font-medium text-foreground mt-1">{stats.unverified}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </Card>

                {/* This Month */}
                <Card className="p-5 bg-card border border-purple-200 dark:border-purple-900/50 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-normal">This Month</p>
                            <p className="text-3xl font-medium text-foreground mt-1">{stats.thisMonth}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                {/* Search and Filters */}
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search companies by name, description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white truncate"
                        />
                    </div>

                    {/* Filter Buttons and Add Button */}
                    <div className="flex items-center gap-3">
                        {/* Filter Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`px-4 py-1.5 truncate text-sm font-normal rounded-md transition-colors ${statusFilter === 'all'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => handleFilterChange('verified')}
                                className={`px-4 py-1.5 truncate text-sm font-normal rounded-md transition-colors ${statusFilter === 'verified'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Verified
                            </button>
                            <button
                                onClick={() => handleFilterChange('not_verified')}
                                className={`px-4 py-1.5 truncate text-sm font-normal rounded-md transition-colors ${statusFilter === 'not_verified'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Not Verified
                            </button>
                        </div>

                        {/* Add Button */}
                        <Button
                            onClick={() => navigate('/companies/new')}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Company
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Created At
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                            Loading...
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <p className="text-red-500 font-medium mb-2">Error loading companies</p>
                                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                                            Retry
                                        </Button>
                                    </td>
                                </tr>
                            ) : companies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No companies found
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company: any) => (
                                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Company */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {company.logo ? (
                                                    <img
                                                        src={company.logo}
                                                        alt={company.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(company.name)}`}>
                                                        {getInitials(company.name)}
                                                    </div>
                                                )}
                                                <span className="font-normal text-gray-900">{company.name}</span>
                                            </div>
                                        </td>

                                        {/* Description */}
                                        <td className="px-6 py-4">
                                            <span className="text-[#1A1A1A] text-sm line-clamp-1 max-w-[200px]">
                                                {company.description || '—'}
                                            </span>
                                        </td>

                                        {/* Created At */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[#1A1A1A]">{formatDateTime(company.createdAt)}</span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {company.isVerified ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-[#A4F4CF] rounded-lg bg-[#ECFDF5] text-[#007A55]">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-[#FEE685] rounded-lg bg-[#FFFBEB] text-[#BB4D00]">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Not Verified
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <Link
                                                    to={`/companies/${company.id}`}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => {
                                                        setUpdateCompanyId(company.id);
                                                        setUpdateCompanyData(company);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => setDeleteCompanyId(company.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                {/* More Options */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {company.isVerified ? (
                                                            <DropdownMenuItem
                                                                onClick={() => setSelectedCompanyId(company.id)}
                                                                className="cursor-pointer text-orange-600"
                                                            >
                                                                <ShieldX className="mr-2 h-4 w-4" />
                                                                Unverify your company
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    verifyCompany.mutate(company.id, {
                                                                        onSuccess: () => { toast.success('Company verified'); refetchAll(); },
                                                                        onError: (e) => toast.error('Failed to verify', { description: (e as any)?.message }),
                                                                    })
                                                                }
                                                                className="cursor-pointer text-green-600"
                                                            >
                                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                                Verify your company
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {companies.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-900">{companies.length}</span> of{' '}
                            <span className="font-medium text-gray-900">{total}</span> companies 
                        </p>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
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
                                        onClick={() => setPage(pageNum)}
                                        className={currentPage === pageNum ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-600'}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!canGoForward}
                                className="text-gray-600"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Unverify Dialog */}
            <Dialog open={!!selectedCompanyId} onOpenChange={(o) => !o && setSelectedCompanyId(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Unverify Company</DialogTitle>
                        <DialogDescription>
                            Provide a reason to mark this company as not verified.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="unverifiedReason">Reason *</Label>
                            <Input
                                id="unverifiedReason"
                                value={unverifiedReason}
                                onChange={(e) => setUnverifiedReason(e.target.value)}
                                placeholder="e.g., Document expired, missing information"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="unverifiedReasonDescription">Details *</Label>
                            <Textarea
                                id="unverifiedReasonDescription"
                                value={unverifiedReasonDescription}
                                onChange={(e) => setUnverifiedReasonDescription(e.target.value)}
                                placeholder="Provide detailed explanation..."
                                className="mt-1"
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedCompanyId(null);
                                setUnverifiedReason('');
                                setUnverifiedReasonDescription('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!selectedCompanyId) return;
                                unverifyCompany.mutate(
                                    { companyId: selectedCompanyId, payload: { unverifiedReason, unverifiedReasonDescription } },
                                    {
                                        onSuccess: () => {
                                            toast.success('Company unverified');
                                            setSelectedCompanyId(null);
                                            setUnverifiedReason('');
                                            setUnverifiedReasonDescription('');
                                            refetchAll();
                                        },
                                        onError: (e) => {
                                            toast.error('Failed to unverify', { description: (e as any)?.message });
                                        },
                                    }
                                );
                            }}
                            disabled={
                                unverifyCompany.isPending || !unverifiedReason || !unverifiedReasonDescription
                            }
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {unverifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Unverification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Company Dialog */}
            <Dialog open={!!updateCompanyId} onOpenChange={(open) => {
                if (!open) {
                    setUpdateCompanyId(null);
                    setUpdateCompanyData(null);
                    reset();
                }
            }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Update Company</DialogTitle>
                        <DialogDescription>
                            Update company information. All fields are required.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit((data) => {
                        if (!updateCompanyId) return;
                        updateCompany.mutate(
                            {
                                companyId: updateCompanyId,
                                payload: {
                                    name: data.name,
                                    description: data.description,
                                    tradeLicenseExpiryDate: new Date(data.tradeLicenseExpiryDate).toISOString(),
                                },
                            },
                            {
                                onSuccess: () => {
                                    toast.success('Company updated successfully');
                                    setUpdateCompanyId(null);
                                    setUpdateCompanyData(null);
                                    reset();
                                    refetchAll();
                                },
                                onError: (e: any) => {
                                    const errorMessage = e?.response?.data?.message || e?.message || 'Failed to update company';
                                    toast.error(errorMessage);
                                },
                            }
                        );
                    })} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="update-name">Company Name *</Label>
                            <Input
                                id="update-name"
                                {...register('name')}
                                placeholder="Company Name"
                                disabled={updateCompany.isPending}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="update-description">Description *</Label>
                            <Textarea
                                id="update-description"
                                {...register('description')}
                                placeholder="Company description..."
                                disabled={updateCompany.isPending}
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="update-expiryDate">License Expiry Date *</Label>
                            <Input
                                id="update-expiryDate"
                                type="date"
                                {...register('tradeLicenseExpiryDate')}
                                disabled={updateCompany.isPending}
                            />
                            {errors.tradeLicenseExpiryDate && (
                                <p className="text-sm text-red-500">{errors.tradeLicenseExpiryDate.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setUpdateCompanyId(null);
                                    setUpdateCompanyData(null);
                                    reset();
                                }}
                                disabled={updateCompany.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateCompany.isPending}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                {updateCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Company
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteCompanyId} onOpenChange={(open) => !open && setDeleteCompanyId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Company</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this company? This action will soft delete the company and cannot be undone easily.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteCompany.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!deleteCompanyId) return;
                                deleteCompany.mutate(deleteCompanyId, {
                                    onSuccess: () => {
                                        toast.success('Company deleted successfully');
                                        setDeleteCompanyId(null);
                                        refetchAll();
                                    },
                                    onError: (e: any) => {
                                        const errorMessage = e?.response?.data?.message || e?.message || 'Failed to delete company';
                                        toast.error(errorMessage);
                                    },
                                });
                            }}
                            disabled={deleteCompany.isPending}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            {deleteCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}