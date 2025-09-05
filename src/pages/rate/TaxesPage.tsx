// src/pages/rate/TaxesPage.tsx
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Plus, Pencil, Trash2, RefreshCw, BadgePercent, ToggleLeft, ToggleRight } from 'lucide-react';

import { useAppSelector } from '@/store';
import TaxDialog from '@/components/Taxes/TaxDialog';

import {
    useCompanyTaxes,
    useCreateCompanyTax,
    useUpdateCompanyTax,
    useToggleCompanyTax,
    useDeleteCompanyTax,
    CompanyTaxItem,
} from '@/hooks/useCompanyTaxes';

type TaxRow = CompanyTaxItem;

export default function TaxesPage() {
    const { locationId = '' } = useParams<{ locationId?: string }>();
    const { otherInfo } = useAppSelector((s) => s.auth);
    const companyId = otherInfo?.companyId || '';
    const canOperate = Boolean(companyId && locationId);

    // --- Fetch all taxes for company (hook now asks for limit=1000) and filter for this location
    const {
        data: taxesResp,
        isLoading: taxesLoading,
        isError: taxesIsError,
        error: taxesErrorObj,
        refetch: refetchTaxes,
    } = useCompanyTaxes(companyId, canOperate);

    const rows: TaxRow[] = React.useMemo(() => {
        const payload = taxesResp?.data?.items ?? [];
        return Array.isArray(payload) ? payload.filter((t) => t.locationId === locationId) : [];
    }, [taxesResp, locationId]);

    // --- Mutations
    const createTax = useCreateCompanyTax(companyId);
    const updateTax = useUpdateCompanyTax(companyId);
    const toggleTax = useToggleCompanyTax(companyId);
    const deleteTax = useDeleteCompanyTax(companyId);

    // UI State
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [editing, setEditing] = React.useState<TaxRow | null>(null);
    const [togglingId, setTogglingId] = React.useState<string | null>(null);
    const [savingEdit, setSavingEdit] = React.useState(false);

    const handleCreate = async (payload: { title: string; description?: string; percentage: string }) => {
        try {
            await createTax.mutateAsync({ ...payload, locationId });
            toast.success('Tax created');
            setOpenCreate(false);
            refetchTaxes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create tax');
        }
    };

    const handleEditSave = async (vals: { title: string; description?: string; percentage: string }) => {
        if (!editing) return;
        try {
            setSavingEdit(true);
            await updateTax.mutateAsync({ taxId: editing.id, payload: vals });
            toast.success('Tax updated');
            setOpenEdit(false);
            setEditing(null);
            refetchTaxes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update tax');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            setTogglingId(id);
            await toggleTax.mutateAsync({ taxId: id });
            toast.success('Tax status updated');
            refetchTaxes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update status');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTax.mutateAsync({ taxId: id });
            toast.success('Tax deleted');
            refetchTaxes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete tax');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-2 md:px-6 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <BadgePercent className="w-7 h-7 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Taxes</h1>
                    </div>
                    <p className="text-muted-foreground text-base">
                        These taxes apply to <span className="font-semibold">this location</span>.
                    </p>
                </div>

                <div className="flex flex-row gap-2">
                    <Button
                        className="gap-2 rounded-xl shadow-md"
                        onClick={() => {
                            if (!canOperate) return toast.error('Company and Location required');
                            setOpenCreate(true);
                        }}
                        disabled={!canOperate || createTax.isPending}
                    >
                        <Plus className="h-5 w-5" />
                        New Tax
                    </Button>
                    <Button variant="outline" className="gap-2 rounded-xl" onClick={() => refetchTaxes()} disabled={taxesLoading}>
                        <RefreshCw className="h-5 w-5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-background/90 rounded-2xl border border-muted shadow-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/70">
                            <TableHead className="w-[48px]"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                            <TableHead className="w-[120px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {rows.map((t, idx) => (
                            <TableRow key={t.id} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-primary/20"
                                        title="Edit"
                                        onClick={() => {
                                            setEditing(t);
                                            setOpenEdit(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>

                                <TableCell className="font-medium">{t.title}</TableCell>
                                <TableCell className="max-w-[420px] truncate" title={t.description || ''}>
                                    {t.description || <span className="text-muted-foreground italic">—</span>}
                                </TableCell>
                                <TableCell className="text-right font-semibold">{Number(t.percentage).toFixed(2)}%</TableCell>

                                <TableCell className="text-center">
                                    {t.isActive ? (
                                        <Badge variant="default">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>

                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {new Date(t.createdAt).toLocaleString()}
                                </TableCell>

                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title={t.isActive ? 'Disable' : 'Enable'}
                                            onClick={() => handleToggle(t.id)}
                                            disabled={togglingId === t.id || toggleTax.isPending}
                                        >
                                            {t.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90"
                                            onClick={() => handleDelete(t.id)}
                                            disabled={deleteTax.isPending}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}

                        {taxesLoading && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                    Loading taxes…
                                </TableCell>
                            </TableRow>
                        )}
                        {!taxesLoading && rows.length === 0 && !taxesIsError && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                    {canOperate ? 'No taxes found for this location.' : 'Company and Location required.'}
                                </TableCell>
                            </TableRow>
                        )}
                        {taxesIsError && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-destructive">
                                    {(taxesErrorObj as any)?.response?.data?.message || 'Failed to load taxes.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create */}
            <TaxDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSave={handleCreate}
                initialValues={undefined}
                editing={false}
            />

            {/* Edit */}
            <TaxDialog
                open={openEdit}
                onClose={() => {
                    setOpenEdit(false);
                    setEditing(null);
                }}
                onSave={handleEditSave}
                initialValues={
                    editing
                        ? {
                            title: editing.title,
                            description: editing.description || '',
                            percentage: editing.percentage, // keep as string
                        }
                        : undefined
                }
                editing={true}
                saving={savingEdit || updateTax.isPending}
            />
        </div>
    );
}