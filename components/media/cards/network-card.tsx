'use client';

import React from 'react';
import Link from 'next/link';
import { useNetworkDetails } from '@/hooks/media/use-network-details';
import { NetworkLogo } from '@/components/media/network-logo';
import { Skeleton } from '@/components/ui/skeleton';

export interface NetworkCardProps {
  id: number;
  /** Shown while the network's details load, and if they fail */
  fallbackName: string;
  className?: string;
}

export function NetworkCard({ id, fallbackName, className = '' }: NetworkCardProps) {
  const { network, loading } = useNetworkDetails(id);
  const name = network?.name || fallbackName;

  return (
    <Link
      href={`/network/${id}`}
      prefetch={false}
      data-focusable="true"
      tabIndex={0}
      aria-label={name}
      className={`block group/net w-full shrink-0 select-none cursor-pointer focus:outline-none focus-visible:outline-none rounded-xl ${className}`}
    >
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-card/65 shadow-lg ring-1 ring-foreground/10 transition-all duration-200 group-hover/net:scale-[1.025] group-hover/net:bg-foreground/10 group-hover/net:ring-foreground/40 group-focus-visible/net:scale-[1.03] group-focus-visible/net:ring-2 group-focus-visible/net:ring-foreground">
        {loading ? (
          <Skeleton className="h-8 w-1/2 rounded-lg" />
        ) : (
          <NetworkLogo
            name={name}
            logoPath={network?.logo_path}
            className="h-[34%] max-w-[62%] opacity-90 transition-opacity duration-200 group-hover/net:opacity-100"
            fallbackClassName="px-4 text-lg sm:text-xl"
          />
        )}
      </div>
    </Link>
  );
}

export default NetworkCard;
