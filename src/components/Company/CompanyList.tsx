import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVerifyCompany, useUnverifyCompany, useGetCompanies } from '@/hooks/useCompanyApi';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronsUpDown, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Verified' },
    { value: 'false', label: 'Not Verified' },
];

const CompaniesList = () => {
    const [search, setSearch] = useState('');
    const [isVerified, setIsVerified] = useState<string>('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useGetCompanies({
        search,
        isVerified: isVerified === '' ? undefined : isVerified === 'true',
        sortBy,
        sortOrder,
        page,
        limit,
    });

    const verifyCompany = useVerifyCompany();
    const unverifyCompany = useUnverifyCompany();

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [unverifiedReason, setUnverifiedReason] = useState('');
    const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');

    // Table sorting logic
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setPage(1);
    };

    const companies = data?.data.companies || [];
    const total = data?.data.companies.length || companies.length;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Top Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div className="flex flex-wrap gap-2 items-end">
                    <Input
                        placeholder="Search companies..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-48"
                    />
                    <div>
                        <Label htmlFor="status" className="sr-only">Status</Label>
                        <select
                            id="status"
                            value={isVerified}
                            onChange={e => { setIsVerified(e.target.value); setPage(1); }}
                            className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="text-sm text-muted-foreground">
                    {total} companies found
                </div>
            </div>

            {/* Table / Loading / Error */}
            <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-56">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="p-8 flex flex-col items-center">
                        <p className="text-destructive font-medium mb-2">Error loading companies:</p>
                        <p className="text-sm text-destructive">{error.message}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        No companies found
                    </div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="px-4 py-3 text-left font-semibold">Name</th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer select-none"
                                    onClick={() => handleSort('isVerified')}
                                >
                                    Status{' '}
                                    {sortBy === 'isVerified'
                                        ? sortOrder === 'ASC'
                                            ? <ChevronUp className="inline w-4 h-4" />
                                            : <ChevronDown className="inline w-4 h-4" />
                                        : <ChevronsUpDown className="inline w-4 h-4 text-muted-foreground" />}
                                </th>
                                <th className="px-4 py-3 text-left">Cities</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => (
                                <tr
                                    key={company.id}
                                    className="border-b hover:bg-muted/40 transition"
                                >
                                    <td className="px-4 py-3 font-medium whitespace-nowrap">{company.name}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={company.isVerified ? 'default' : 'secondary'}>
                                            {company.isVerified ? 'Verified' : 'Not Verified'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {company.citiesOfOperation?.map(city => (
                                                <span key={city} className="bg-muted px-2 py-1 rounded text-xs">
                                                    {city}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <Button asChild variant="outline" size="sm">
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
                                                >
                                                    {unverifyCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Unverify
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        verifyCompany.mutate(company.id, {
                                                            onSuccess: () => {
                                                                toast.success('Company verified successfully');
                                                                refetch();
                                                            },
                                                            onError: (error) => {
                                                                toast.error('Failed to verify company', { description: error.message });
                                                            }
                                                        })
                                                    }
                                                    disabled={verifyCompany.isPending}
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

            {/* Pagination Controls */}
            {total > limit && (
                <div className="flex justify-between items-center mt-6">
                    <Button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                    >
                        Prev
                    </Button>
                    <span className="text-sm">
                        Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <Button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= Math.ceil(total / limit)}
                        variant="outline"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Unverify Dialog */}
            <Dialog open={!!selectedCompanyId} onOpenChange={(open) => !open && setSelectedCompanyId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unverify Company</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for unverifying this company.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="unverifiedReason">Reason *</Label>
                            <Input
                                id="unverifiedReason"
                                value={unverifiedReason}
                                onChange={(e) => setUnverifiedReason(e.target.value)}
                                placeholder="e.g., Document Expired, Missing Information"
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
                                unverifyCompany.mutate(
                                    { companyId: selectedCompanyId!, payload: { unverifiedReason, unverifiedReasonDescription } },
                                    {
                                        onSuccess: () => {
                                            toast.success('Company unverified successfully');
                                            setSelectedCompanyId(null);
                                            setUnverifiedReason('');
                                            setUnverifiedReasonDescription('');
                                            refetch();
                                        },
                                        onError: (error) => {
                                            toast.error('Failed to unverify company', { description: error.message });
                                        },
                                    }
                                );
                            }}
                            disabled={
                                unverifyCompany.isPending ||
                                !unverifiedReason ||
                                !unverifiedReasonDescription
                            }
                        >
                            {unverifyCompany.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirm Unverification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CompaniesList;
