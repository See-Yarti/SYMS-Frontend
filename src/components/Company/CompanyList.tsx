// src/pages/company/CompaniesList.tsx

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useVerifyCompany, useUnverifyCompany, useGetCompanies } from '@/hooks/useCompanyApi';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, ChevronsUpDown, ChevronUp, ChevronDown, Eye, Copy, CheckCircle2, XCircle,
} from 'lucide-react';

type SortOrder = 'ASC' | 'DESC';

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Verified' },
    { value: 'false', label: 'Not Verified' },
];

const getInitials = (name?: string) => {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
};

export default function CompaniesList() {
    // Filters & table state
    const [search, setSearch] = useState('');
    const [isVerified, setIsVerified] = useState<string>('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Data
    const { data, isLoading, error, refetch } = useGetCompanies({
        search,
        isVerified: isVerified === '' ? undefined : isVerified === 'true',
        sortBy,
        sortOrder,
        page,
        limit,
    });

    const companies = useMemo(
        () => (data?.data?.companies ?? []),
        [data]
    );
    const total = companies.length;

    // Mutations
    const verifyCompany = useVerifyCompany();
    const unverifyCompany = useUnverifyCompany();

    // Unverify dialog
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [unverifiedReason, setUnverifiedReason] = useState('');
    const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');

    // Sorting
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    };

    // Copy ID
    const copyId = async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            toast.success('Company ID copied');
        } catch {
            toast.error('Failed to copy ID');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-2 md:px-6 py-8 space-y-8">
            {/* Fancy banner */}
            <div className="relative overflow-hidden rounded-2xl border shadow-md bg-gradient-to-r from-primary/15 via-fuchsia-200/30 to-emerald-200/30 dark:from-primary/10 dark:via-fuchsia-300/20 dark:to-emerald-300/20">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Companies
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage verification, browse company details, and jump into profiles quickly.
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-3">
                            <Badge variant="default" className="bg-primary/90">
                                {total} total
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
            </div>

            {/* Filters row */}
            <div className=" px-1">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="search" className="text-xs">Search</Label>
                            <Input
                                id="search"
                                placeholder="Search companies..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-56"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="status" className="text-xs flex">Status</Label>
                            {/* native select to avoid Radix empty-value issue */}
                            <select
                                id="status"
                                value={isVerified}
                                onChange={(e) => { setIsVerified(e.target.value); setPage(1); }}
                                className="border rounded-md px-3 py-[9px] text-sm min-w-[140px] bg-background"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table / Loading / Error */}
            <div className="rounded-2xl bg-background/90 overflow-x-auto border border-muted shadow-lg">
                {isLoading ? (
                    <div className="p-6">
                        {/* simple skeleton rows */}
                        <div className="animate-pulse space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 rounded-md bg-muted/60" />
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-8 flex flex-col items-center">
                        <p className="text-destructive font-medium mb-1">Error loading companies</p>
                        <p className="text-sm text-muted-foreground">{(error as any)?.message || 'Unknown error'}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-primary/10 text-primary text-sm font-medium">
                            Nothing here yet
                        </div>
                        <p className="text-muted-foreground mt-2">No companies match your filters.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/70 sticky top-0 z-10">
                                <th className="px-4 py-3 text-left font-semibold">Company ID</th>
                                <th
                                    className="px-4 py-3 text-left font-semibold cursor-pointer select-none"
                                    onClick={() => handleSort('name')}
                                >
                                    Name
                                    {' '}
                                    {sortBy === 'name'
                                        ? (sortOrder === 'ASC' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)
                                        : <ChevronsUpDown className="inline w-4 h-4 text-muted-foreground" />}
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-semibold cursor-pointer select-none"
                                    onClick={() => handleSort('isVerified')}
                                >
                                    Status
                                    {' '}
                                    {sortBy === 'isVerified'
                                        ? (sortOrder === 'ASC' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)
                                        : <ChevronsUpDown className="inline w-4 h-4 text-muted-foreground" />}
                                </th>
                                <th className="px-4 py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company: any, idx: number) => (
                                <tr
                                    key={company.id}
                                    className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}
                                >
                                    {/* Company ID with copy */}
                                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[220px]" title={company.id}>{company.id}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:bg-primary/15"
                                                onClick={() => copyId(company.id)}
                                                aria-label="Copy ID"
                                                title="Copy ID"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>

                                    {/* Name with “logo”/initials */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {company.logo ? (
                                                <img
                                                    src={company.logo}
                                                    alt={company.name}
                                                    className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full grid place-items-center bg-gradient-to-br from-primary/80 to-fuchsia-500 text-white text-xs font-semibold ring-2 ring-primary/20">
                                                    {getInitials(company.name)}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-medium">{company.name}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1 max-w-[340px]">
                                                    {company.description || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        {company.isVerified ? (
                                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1">
                                                <XCircle className="h-3.5 w-3.5" />
                                                Not Verified
                                            </Badge>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            <Button asChild variant="outline" size="sm" className="rounded-lg">
                                                <Link to={`/companies/${company.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </Button>

                                            {company.isVerified ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedCompanyId(company.id)}
                                                    disabled={unverifyCompany.isPending}
                                                    className="rounded-lg"
                                                >
                                                    {unverifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Unverify
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        verifyCompany.mutate(company.id, {
                                                            onSuccess: () => { toast.success('Company verified'); refetch(); },
                                                            onError: (e) => toast.error('Failed to verify', { description: (e as any)?.message }),
                                                        })
                                                    }
                                                    disabled={verifyCompany.isPending}
                                                    className="rounded-lg bg-primary/90 hover:bg-primary"
                                                >
                                                    {verifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Verify
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* (Optional) Pagination: shown only if you later wire total pages from API
      {total > limit && (
        <div className="flex justify-between items-center mt-6">
          <Button onClick={() => setPage(page - 1)} disabled={page === 1} variant="outline">Prev</Button>
          <span className="text-sm">Page {page} of {Math.ceil(total / limit)}</span>
          <Button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / limit)} variant="outline">Next</Button>
        </div>
      )} */}

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
                                            refetch();
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
                            className="bg-rose-600/90 hover:bg-rose-600"
                        >
                            {unverifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Unverification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
