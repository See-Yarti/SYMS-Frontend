import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { format } from 'date-fns';
import { useGetCompany, useUnverifyCompany, useVerifyCompany } from '@/hooks/useCompanyApi';

const CompanyDetail = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const { data, isLoading, error, refetch } = useGetCompany(companyId || '');
    const verifyCompany = useVerifyCompany();
    const unverifyCompany = useUnverifyCompany();

    const [isUnverifyDialogOpen, setIsUnverifyDialogOpen] = useState(false);
    const [unverifiedReason, setUnverifiedReason] = useState('');
    const [unverifiedReasonDescription, setUnverifiedReasonDescription] = useState('');

    const handleVerify = () => {
        if (!companyId) return;
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

    const handleUnverifySubmit = () => {
        if (!companyId) return;

        unverifyCompany.mutate(
            {
                companyId,
                payload: {
                    unverifiedReason,
                    unverifiedReasonDescription,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Company unverified successfully');
                    setIsUnverifyDialogOpen(false);
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
                <p>Error loading company details:</p>
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

    if (!data) {
        return (
            <div className="rounded-lg border p-4 text-center">
                <p>Company not found</p>
            </div>
        );
    }

    const company = data.data.company;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{company.name}</h1>
                    <p className="text-muted-foreground">{company.description}</p>
                </div>

                <Badge
                    variant={company.isVerified ? 'default' : 'secondary'}
                    className="ml-2"
                >
                    {company.isVerified ? 'Verified' : 'Not Verified'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Details Card */}
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Company Details</h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Tax Number</p>
                            <p>{company.taxNumber || '-'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Trade License</p>
                            <p>{company.tradeLicenseIssueNumber || '-'}</p>
                            {company.tradeLicenseExpiryDate && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Expires: {format(new Date(company.tradeLicenseExpiryDate), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>

                        {company.citiesOfOperation?.length > 0 && (
                            <div>
                                <p className="text-sm text-muted-foreground">Cities of Operation</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {company.citiesOfOperation.map((city) => (
                                        <span key={city} className="bg-muted px-2 py-1 rounded text-sm">
                                            {city}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p>{format(new Date(company.createdAt), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                    </div>
                </div>

                {/* Documents Card */}
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Documents</h2>

                    <div className="space-y-4">
                        {company.taxFile ? (
                            <div>
                                <p className="text-sm text-muted-foreground">Tax File</p>
                                <a
                                    href={company.taxFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center"
                                >
                                    View Tax File
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="ml-1"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-muted-foreground">Tax File</p>
                                <p className="text-muted-foreground">Not provided</p>
                            </div>
                        )}

                        {company.tradeLicenseFile ? (
                            <div>
                                <p className="text-sm text-muted-foreground">Trade License</p>
                                <a
                                    href={company.tradeLicenseFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center"
                                >
                                    View Trade License
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="ml-1"
                                    >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-muted-foreground">Trade License</p>
                                <p className="text-muted-foreground">Not provided</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Operators Section */}
            {company.operators && company.operators.length > 0 && (
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Operators</h2>

                    <div className="space-y-3">
                        {company.operators.map((operator) => (
                            <div key={operator.id} className="flex items-center gap-3 p-3 border rounded">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                    {operator.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{operator.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{operator.user.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {operator.operatorRole.replace('Operator', '').trim() || 'Operator'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Last active: {format(new Date(operator.user.lastActivityAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Addresses Section */}
            {company.addresses && company.addresses.length > 0 && (
                <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Addresses</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.addresses.map((address) => (
                            <div key={address.id} className="border rounded p-4">
                                <h3 className="font-medium">{address.addressLabel}</h3>
                                <p className="text-sm mt-1">
                                    {address.street}, {address.apartment}
                                </p>
                                <p className="text-sm">
                                    {address.city}, {address.state}, {address.country}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {address.additionalInfo}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Verification Actions */}
            <div className="flex gap-2">
                {company.isVerified ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setIsUnverifyDialogOpen(true)}
                            disabled={unverifyCompany.isPending}
                        >
                            Unverify Company
                        </Button>

                        <Dialog open={isUnverifyDialogOpen} onOpenChange={setIsUnverifyDialogOpen}>
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
                                            setIsUnverifyDialogOpen(false);
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
                    </>
                ) : (
                    <Button
                        onClick={handleVerify}
                        disabled={verifyCompany.isPending}
                    >
                        {verifyCompany.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify Company
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CompanyDetail;