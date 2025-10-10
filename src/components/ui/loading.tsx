// src/components/ui/loading.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export type InlineLoaderProps = {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
};

const sizeMap: Record<NonNullable<InlineLoaderProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'md',
  message,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-muted-foreground text-sm',
        className,
      )}
    >
      <Loader2 className={cn('animate-spin', sizeMap[size])} />
      {message && <span className="whitespace-nowrap">{message}…</span>}
    </span>
  );
};

export const PageLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
};

export const SectionLoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-44" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
};

export const LoadingPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton className={cn('h-4 w-24', className)} />
);
