'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, RefreshCw, Heart, Archive, Clock, ShoppingBag, Package } from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import type { Pair } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'accent' | 'success' | 'muted' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  on_order: { label: 'On Order', variant: 'accent' },
  stored: { label: 'Stored', variant: 'muted' },
  sold: { label: 'Sold', variant: 'danger' },
};

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPairs = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pairs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPairs(data as Pair[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPairs();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchPairs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPairs();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-welted-text-muted">Sign in to view your collection.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-welted-text">My Collection</h1>
          <p className="text-welted-text-muted text-sm mt-0.5">
            {pairs.length} {pairs.length === 1 ? 'pair' : 'pairs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>
          <Link href="/wishlist">
            <Button variant="secondary" size="sm">
              <Heart size={14} className="mr-1.5" />
              Wish List
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      {pairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="text-welted-text-muted mb-4" />
          <h2 className="text-lg font-semibold text-welted-text mb-1">No pairs yet</h2>
          <p className="text-welted-text-muted text-sm mb-6">
            Start building your collection by adding your first pair.
          </p>
          <Link href="/collection/new">
            <Button>
              <Plus size={16} className="mr-1.5" />
              Add Your First Pair
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pairs.map((pair, index) => {
            const status = STATUS_CONFIG[pair.status] || STATUS_CONFIG.active;
            const imageUrl = pair.image_urls?.[0];

            return (
              <Link key={pair.id} href={`/collection/${pair.id}`} className="block">
                <Card hover className="overflow-hidden">
                  {/* Image */}
                  <div className="relative w-full bg-welted-input-bg">
                    {imageUrl ? (
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={imageSrc(imageUrl)}
                          alt={`${pair.brand} ${pair.model}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          priority={index < 4}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center aspect-[4/3]">
                        <Package size={40} className="text-welted-text-muted/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-welted-text-muted text-[10px] font-semibold uppercase tracking-wider">
                      {pair.brand}
                    </p>
                    <p className="text-welted-text font-bold text-sm mt-0.5 truncate">
                      {pair.model}
                    </p>
                    {(pair.size_us || pair.colorway) && (
                      <p className="text-welted-text-muted text-xs mt-1 truncate">
                        {pair.size_us ? `US ${pair.size_us}` : ''}
                        {pair.size_us && pair.width ? ` ${pair.width}` : ''}
                        {(pair.size_us || pair.width) && pair.colorway ? ' · ' : ''}
                        {pair.colorway || ''}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* FAB */}
      {pairs.length > 0 && (
        <Link
          href="/collection/new"
          className="fixed bottom-24 md:bottom-8 right-6 z-40 w-14 h-14 rounded-full bg-welted-accent hover:bg-welted-accent-dim text-welted-bg flex items-center justify-center shadow-lg transition-colors"
        >
          <Plus size={24} />
        </Link>
      )}
    </div>
  );
}
