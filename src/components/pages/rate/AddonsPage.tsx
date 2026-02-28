'use client';

import * as React from 'react';
import { useParams } from '@/hooks/useNextNavigation';
import { useAppSelector } from '@/store';
import { toast } from 'sonner';
import { Loader2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGetLocationAddons,
  useUpdateLocationAddons,
} from '@/hooks/useAddonsApi';

type AddonFormItem = {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  perDayRate: string;
};

export default function AddonsPage() {
  const { locationId = '' } = useParams<{ locationId?: string }>();
  const { otherInfo } = useAppSelector((s) => s.auth);
  const companyId = otherInfo?.companyId || '';
  const canOperate = Boolean(companyId && locationId);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetLocationAddons(locationId);
  const updateAddons = useUpdateLocationAddons(locationId);

  const [addons, setAddons] = React.useState<AddonFormItem[]>([]);

  React.useEffect(() => {
    if (!data?.addons) return;
    setAddons(
      data.addons.map((a) => ({
        key: a.key,
        name: a.name,
        description: a.description,
        isEnabled: a.isEnabled,
        perDayRate:
          a.perDayRate != null && Number.isFinite(Number(a.perDayRate))
            ? String(a.perDayRate)
            : '',
      })),
    );
  }, [data]);

  const handleToggle = (key: string, checked: boolean) => {
    setAddons((prev) =>
      prev.map((a) =>
        a.key === key
          ? {
              ...a,
              isEnabled: checked,
              perDayRate: checked && !a.perDayRate ? '1' : a.perDayRate,
            }
          : a,
      ),
    );
  };

  const handleRateChange = (key: string, value: string) => {
    setAddons((prev) =>
      prev.map((a) => (a.key === key ? { ...a, perDayRate: value } : a)),
    );
  };

  const handleSave = async () => {
    const invalid = addons.find((a) => {
      if (!a.isEnabled) return false;
      const rate = Number(a.perDayRate);
      return !Number.isFinite(rate) || rate <= 0;
    });

    if (invalid) {
      toast.error(`Enter valid per-day rate for ${invalid.name}`);
      return;
    }

    try {
      await updateAddons.mutateAsync({
        addons: addons.map((a) => ({
          key: a.key,
          perDayRate: a.isEnabled ? Number(a.perDayRate) : null,
        })),
      });
      toast.success('Add-ons updated successfully');
      refetch();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Failed to update add-ons';
      toast.error(message);
    }
  };

  if (!canOperate) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Company and location required to manage add-ons.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load add-ons.</p>
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
      <Card className="rounded-xl border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F56304]">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Location Add-ons</h2>
              <p className="text-sm text-gray-500">
                Enable add-ons and set per-day prices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addons.map((addon) => (
          <Card key={addon.key} className="rounded-xl border border-gray-200 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{addon.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                </div>
                <Switch
                  checked={addon.isEnabled}
                  onCheckedChange={(checked) => handleToggle(addon.key, checked)}
                  className="data-[state=checked]:bg-[#F56304]"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Per day rate</Label>
                <div className="mt-1.5 flex items-center">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={addon.perDayRate}
                    onChange={(e) => handleRateChange(addon.key, e.target.value)}
                    disabled={!addon.isEnabled}
                    placeholder="0.00"
                    className="h-10 flex-1 rounded-lg border-gray-200 bg-gray-50"
                  />
                  <span className="ml-2 text-sm text-gray-500">USD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {addons.length === 0 && (
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">
              No add-ons returned for this location yet.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateAddons.isPending}
          className="rounded-lg bg-[#F56304] hover:bg-[#e05503] text-white px-6"
        >
          {updateAddons.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Add-ons'
          )}
        </Button>
      </div>
    </div>
  );
}
