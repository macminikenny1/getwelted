'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, RefreshCw, Heart, Archive, Clock, ShoppingBag, Package, Receipt, ChevronDown } from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import type { Pair, Profile } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'accent' | 'success' | 'muted' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  on_order: { label: 'On Order', variant: 'accent' },
  stored: { label: 'Stored', variant: 'muted' },
  sold: { label: 'Sold', variant: 'danger' },
};

interface TransactionRecord {
  id: string;
  type: 'buy' | 'sell' | 'trade';
  brand: string;
  model: string;
  otherUsername: string;
  otherAvatarUrl: string | null;
  date: string;
  listingId: string;
}

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    // Fetch sales where user was seller
    const { data: salesAsSeller } = await supabase
      .from('bst_listings')
      .select('id, brand, model, created_at, buyer_id, buyer:profiles!bst_listings_buyer_id_fkey(username, avatar_url)')
      .eq('user_id', user.id)
      .eq('status', 'sold')
      .not('buyer_id', 'is', null)
      .order('created_at', { ascending: false });

    // Fetch sales where user was buyer
    const { data: salesAsBuyer } = await supabase
      .from('bst_listings')
      .select('id, brand, model, created_at, user_id, seller:profiles!bst_listings_user_id_fkey(username, avatar_url)')
      .eq('buyer_id', user.id)
      .eq('status', 'sold')
      .order('created_at', { ascending: false });

    // Check which listings had trade offers (to distinguish trades from sales)
    const allListingIds = [
      ...(salesAsSeller || []).map((s: any) => s.id),
      ...(salesAsBuyer || []).map((s: any) => s.id),
    ];

    let tradeListingIds = new Set<string>();
    if (allListingIds.length > 0) {
      const { data: tradeOffers } = await supabase
        .from('trade_offers')
        .select('listing_id')
        .in('listing_id', allListingIds)
        .in('status', ['accepted', 'completed']);

      if (tradeOffers) {
        tradeListingIds = new Set(tradeOffers.map((t: any) => t.listing_id));
      }
    }

    const txs: TransactionRecord[] = [];

    // Map seller transactions
    (salesAsSeller || []).forEach((sale: any) => {
      const buyer = sale.buyer;
      if (!buyer) return;
      const isTrade = tradeListingIds.has(sale.id);
      txs.push({
        id: sale.id,
        type: isTrade ? 'trade' : 'sell',
        brand: sale.brand,
        model: sale.model,
        otherUsername: buyer.username,
        otherAvatarUrl: buyer.avatar_url,
        date: sale.created_at,
        listingId: sale.id,
      });
    });

    // Map buyer transactions
    (salesAsBuyer || []).forEach((sale: any) => {
      const seller = sale.seller;
      if (!seller) return;
      // Skip if already added as a trade from the seller side
      if (txs.some((t) => t.id === sale.id)) return;
      const isTrade = tradeListingIds.has(sale.id);
      txs.push({
        id: sale.id,
        type: isTrade ? 'trade' : 'buy',
        brand: sale.brand,
        model: sale.model,
        otherUsername: seller.username,
        otherAvatarUrl: seller.avatar_url,
        date: sale.created_at,
        listingId: sale.id,
      });
    });

    // Sort by date descending
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPairs();
      fetchTransactions();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchPairs, fetchTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPairs();
    fetchTransactions();
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

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 mb-4 group"
          >
            <Receipt size={18} className="text-welted-accent" />
            <h2 className="text-base font-bold text-welted-text">Transaction History</h2>
            <Badge variant="muted">{transactions.length}</Badge>
            <ChevronDown
              size={16}
              className={`text-welted-text-muted transition-transform ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>

          {showHistory && (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Link key={`${tx.id}-${tx.type}`} href={`/bst/${tx.listingId}`}>
                  <Card hover className="p-3 flex items-center gap-3">
                    <Avatar url={tx.otherAvatarUrl} name={tx.otherUsername} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-welted-text truncate">
                        {tx.brand} {tx.model}
                      </p>
                      <p className="text-xs text-welted-text-muted">
                        {tx.type === 'buy' ? 'Bought from' : tx.type === 'sell' ? 'Sold to' : 'Traded with'}{' '}
                        {tx.otherUsername}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={tx.type === 'buy' ? 'success' : tx.type === 'sell' ? 'danger' : 'accent'}>
                        {tx.type === 'buy' ? 'Bought' : tx.type === 'sell' ? 'Sold' : 'Traded'}
                      </Badge>
                      <p className="text-[10px] text-welted-text-muted mt-1">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
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
