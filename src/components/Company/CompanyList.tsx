import { useState } from 'react';
import { useGetCompanies } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { useVerifyCompany, useUnverifyCompany } from '@/hooks/useApi';
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
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';


const CompaniesList = () => {
    const { data, isLoading, error, refetch } = useGetCompanies();
    const verifyCompany = useVerifyCompany();
    const unverifyCompany = useUnverifyCompany();

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [unverifiedReason, setUnverifiedReason] = useState('');
    const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');

    const handleVerify = (companyId: string) => {
        verifyCompany.mutate(companyId, {
            onSuccess: () => {
                toast.success('Company verified successfully');
                refetch();
            },
            onError: (error) => {
                toast.error('Failed to verify company', {
                    description: error.message,
                });
            },
        });
    };

    const handleUnverify = (companyId: string) => {
        setSelectedCompanyId(companyId);
    };

    const handleUnverifySubmit = () => {
        if (!selectedCompanyId) return;

        unverifyCompany.mutate(
            {
                companyId: selectedCompanyId,
                payload: {
                    unverifiedReason,
                    unverifiedReasonDescription,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Company unverified successfully');
                    setSelectedCompanyId(null);
                    setUnverifiedReason('');
                    setUnverifiedReasonDescription('');
                    refetch();
                },
                onError: (error) => {
                    toast.error('Failed to unverify company', {
                        description: error.message,
                    });
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive p-4 text-destructive">
                <p>Error loading companies:</p>
                <p className="font-medium">{error.message}</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => refetch()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center">
                <div className="text-sm text-muted-foreground">
                    {data?.data.companies.length} companies found
                </div>
            </div>

            {data?.data.companies.length === 0 ? (
                <div className="border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">No companies found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.data.companies.map((company) => (
                        <div
                            key={company.id}
                            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                        >
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-lg font-semibold">{company.name}</h2>
                                    <Badge
                                        variant={company.isVerified ? 'default' : 'secondary'}
                                        className="ml-2"
                                    >
                                        {company.isVerified ? 'Verified' : 'Not Verified'}
                                    </Badge>
                                </div>

                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {company.description}
                                </p>

                                {company.citiesOfOperation?.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs text-muted-foreground">Operating in:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {company.citiesOfOperation.map((city) => (
                                                <span
                                                    key={city}
                                                    className="text-xs bg-muted px-2 py-1 rounded"
                                                >
                                                    {city}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="flex-1"
                                >
                                    <Link to={`/companies/${company.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </Link>
                                </Button>

                                {company.isVerified ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUnverify(company.id)}
                                        disabled={unverifyCompany.isPending}
                                        className="flex-1"
                                    >
                                        {unverifyCompany.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Unverify
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => handleVerify(company.id)}
                                        disabled={verifyCompany.isPending}
                                        className="flex-1"
                                    >
                                        {verifyCompany.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Verify
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Unverify Dialog */}
            <Dialog
                open={!!selectedCompanyId}
                onOpenChange={(open) => !open && setSelectedCompanyId(null)}
            >
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
                            <p className="text-xs text-muted-foreground mt-1">
                                Short description of why you're unverifying this company
                            </p>
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
                            <p className="text-xs text-muted-foreground mt-1">
                                This will be visible to the company
                            </p>
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
                            onClick={handleUnverifySubmit}
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