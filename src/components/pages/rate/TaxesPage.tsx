'use client';

// src/pages/rate/TaxesPage.tsx
import * as React from 'react';
import { useParams } from '@/hooks/useNextNavigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  MoreVertical,
} from 'lucide-react';

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
    return Array.isArray(payload)
      ? payload.filter((t) => t.locationId === locationId)
      : [];
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
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredRows = rows.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  });

  const handleCreate = async (payload: {
    title: string;
    description?: string;
    percentage?: string;
    amount?: string;
    taxType: 'PERCENTAGE' | 'FIXED';
  }) => {
    try {
      await createTax.mutateAsync({ ...payload, locationId });
      toast.success('Tax created');
      setOpenCreate(false);
      refetchTaxes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create tax');
    }
  };

  const handleEditSave = async (vals: {
    title: string;
    description?: string;
    percentage?: string;
    amount?: string;
    taxType: 'PERCENTAGE' | 'FIXED';
  }) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Taxes Management</h1>
      </div>

      {/* Combined Filter + Table Card - Exact design match */}
      <div className="rounded-[20px] bg-white border border-gray-200 shadow-md overflow-hidden">
        {/* Search and Filter Bar with Add Button - Full width */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search Title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg border-gray-300 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchTaxes()}
            disabled={taxesLoading}
            className="rounded-lg border-gray-300 h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              if (!canOperate)
                return toast.error('Company and Location required');
              setOpenCreate(true);
            }}
            disabled={!canOperate || createTax.isPending}
            className="gap-2 rounded-lg bg-[#F56304] hover:bg-[#e05503] text-white h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            Add New Tax
          </Button>
        </div>

        {/* Table */}
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Title
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Description
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Value
              </th>
              <th className="px-6 py-3.5 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Created
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRows.map((t, idx) => (
              <tr
                key={t.id}
                className={
                  idx % 2 === 0
                    ? 'bg-white hover:bg-gray-50/50 transition-colors'
                    : 'bg-gray-50/30 hover:bg-gray-50/50 transition-colors'
                }
              >
                <td className="px-6 py-4">
                  <span className="font-semibold text-[#F56304] text-sm">
                    {t.title}
                  </span>
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-700 max-w-[420px] truncate"
                  title={t.description || ''}
                >
                  {t.description || (
                    <span className="text-gray-400 italic">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {t.taxType === 'PERCENTAGE'
                    ? `${Number(t.percentage).toFixed(1)}%`
                    : `$${Number(t.amount).toFixed(2)}`}
                </td>
                <td className="px-6 py-4 text-center">
                  <Switch
                    checked={t.isActive}
                    onCheckedChange={() => handleToggle(t.id)}
                    disabled={togglingId === t.id || toggleTax.isPending}
                    className="data-[state=checked]:bg-green-500"
                  />
                </td>
                <td className="px-6 py-4 text-right text-xs text-gray-500">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(t);
                          setOpenEdit(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(t.id)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                        disabled={deleteTax.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}

            {taxesLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-muted-foreground text-sm"
                >
                  Loading taxes…
                </td>
              </tr>
            )}
            {!taxesLoading && filteredRows.length === 0 && !taxesIsError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-muted-foreground text-sm"
                >
                  {searchQuery ? (
                    <span>No taxes found matching your search.</span>
                  ) : canOperate ? (
                    <span>
                      No taxes found. Click <b>Add New Tax</b> to get started.
                    </span>
                  ) : (
                    <span>Company and Location required.</span>
                  )}
                </td>
              </tr>
            )}
            {taxesIsError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-destructive text-sm"
                >
                  {(taxesErrorObj as any)?.response?.data?.message ||
                    'Failed to load taxes.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                amount: editing.amount, // keep as string
                taxType: editing.taxType,
              }
            : undefined
        }
        editing={true}
        saving={savingEdit || updateTax.isPending}
      />
    </div>
  );
}
