// src/pages/Home.tsx
import React, { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { useGetUserByEmail } from '@/hooks/useOperatorApi';
import { useGetCompanySettings } from '@/hooks/usePlansApi';
import { Crown, Gem, Diamond, CircleDot } from 'lucide-react';

type Tier = 'BASIC' | 'GOLD' | 'PREMIUM' | 'DIAMOND';

const tierMeta: Record<
  Tier,
  { label: string; Icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  BASIC: {
    label: 'Basic',
    Icon: CircleDot,
    classes: 'bg-muted text-muted-foreground ring-1 ring-border',
  },
  GOLD: {
    label: 'Gold',
    Icon: Crown,
    classes: 'bg-primary text-primary-foreground ring-1 ring-border',
  },
  PREMIUM: {
    label: 'Premium',
    Icon: Gem,
    classes: 'bg-accent text-accent-foreground ring-1 ring-border',
  },
  DIAMOND: {
    label: 'Diamond',
    Icon: Diamond,
    classes: 'bg-secondary text-secondary-foreground ring-1 ring-border',
  },
};

function formatPercent(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const hasPct = trimmed.endsWith('%');
    const numeric = Number(hasPct ? trimmed.slice(0, -1) : trimmed);
    if (Number.isFinite(numeric)) return `${numeric.toFixed(2)}%`;
    return hasPct ? trimmed : `${trimmed}%`;
  }
  if (typeof value === 'number') return `${value.toFixed(2)}%`;
  return '—';
}

function TierBadgeInline({ tier }: { tier?: Tier | string }) {
  if (!tier) return null;
  const safeTier = (typeof tier === 'string' ? tier.toUpperCase() : tier) as Tier;
  const meta = tierMeta[safeTier] ?? tierMeta.BASIC;
  const { Icon, label, classes } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}
      title={`Current tier: ${label}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="uppercase tracking-wide">{label}</span>
    </span>
  );
}

const Home: React.FC = () => {
  const { user: authUser, otherInfo } = useAppSelector((state) => state.auth);

  // 1) Call user hook UNCONDITIONALLY
  const email = authUser?.email ?? '';
  const {
    data: userRes,
    isLoading: userLoading,
    isError: userIsError,
    error: userError,
  } = useGetUserByEmail(email);

  // 2) Derive companyId from whatever we have (may be '')
  const rawUser = userRes?.data?.user;
  const companyId =
    (rawUser as any)?.companyId ||
    (rawUser as any)?.company?.id ||
    (otherInfo as any)?.companyId ||
    '';

  // 3) Call settings hook UNCONDITIONALLY with a string ('' when unknown)
  const {
    data: settingsRes,
    isLoading: settingsLoading,
    isError: settingsIsError,
    // error: settingsError,
  } = useGetCompanySettings(companyId || '');

  // 4) Compute view-models (not hooks)
  const user = rawUser;
  const displayRole =
    user?.role === 'operator' && otherInfo?.operatorRole
      ? otherInfo.operatorRole
      : user?.role;

  const formattedRole = (displayRole || '')
    .split(/(?=[A-Z])/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const currentTier: Tier | undefined = settingsRes?.data?.settings?.currentTier;
  const effectiveRate: number | string | undefined =
    settingsRes?.data?.settings?.effectiveCommissionRate ??
    settingsRes?.data?.baseCommissionRate;

  // 5) useMemo also called unconditionally
  const canSeeTierSummary = useMemo(() => {
    const role = (user?.role || '').toLowerCase();
    return role !== 'admin';
  }, [user?.role]);

  // ——— Rendering ———
  if (userLoading) {
    return <div className="p-4">Loading user data...</div>;
  }

  if (userIsError) {
    return (
      <div className="p-4 text-destructive">
        Error fetching user data: {(userError as any)?.message || 'Unknown error'}
      </div>
    );
  }

  if (!user) {
    return <div className="p-4">User not found.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="border rounded-lg shadow p-6 bg-card text-card-foreground">
        {/* User header */}
        <div className="flex items-center gap-4 mb-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted text-foreground flex items-center justify-center text-xl font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">{user.name}</h2>
            <p className="text-sm text-muted-foreground truncate">Email: {user.email}</p>
            <p className="text-sm text-muted-foreground truncate">ID: {user.id}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
              {formattedRole || '—'}
            </span>
          </div>
        </div>

        {/* Tier + Effective summary (hidden from admins) */}
        {/* {canSeeTierSummary && (
          <div className="mt-2 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Tier</span>
                {settingsLoading ? (
                  <span className="text-sm text-muted-foreground">Loading…</span>
                ) : settingsIsError ? (
                  <span className="text-sm text-destructive">Failed to load</span>
                ) : (
                  <TierBadgeInline tier={currentTier} />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Commission:</span>
                <span className="text-sm font-semibold">
                  {settingsLoading ? '…' : formatPercent(effectiveRate)}
                </span>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Home;