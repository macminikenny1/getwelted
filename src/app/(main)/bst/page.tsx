'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchReputationBatch } from '@/lib/reputation';
import { formatTimeAgo } from '@/lib/formatTime';
import type { BSTListing, Profile } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Chip from '@/components/ui/Chip';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { SlidersHorizontal, Plus, Package } from 'lucide-react';

const BRANDS = [
  'Alden', 'Viberg', 'White\'s', 'Nick\'s', 'Red Wing',
  'Grant Stone', 'Parkhurst', 'Truman', 'Wesco', 'Crockett & Jones',
];
const SIZES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15];
const WIDTHS = ['B', 'C', 'D', 'E', 'EE', 'EEE'];

interface ListingWithJoins extends BSTListing {
  profiles: Profile;
  pairs: { image_urls: string[] } | null;
}

function BSTCard({
  listing,
  reputation,
  priority = false,
}: {
  listing: ListingWithJoins;
  reputation?: { total: number; score: number };
  priority?: boolean;
}) {
  const router = useRouter();
  const imageUrl =
    listing.image_urls?.[0] || listing.pairs?.image_urls?.[0] || null;

  return (
    <Card
      hover
      onClick={() => router.push(`/bst/${listing.id}`)}
      className="overflow-hidden text-left w-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-welted-input-bg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${listing.brand} ${listing.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package size={32} className="text-welted-text-muted" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Brand + Model */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-welted-text-muted">
            {listing.brand}
          </p>
          <p className="text-sm font-bold text-welted-text truncate">
            {listing.model}
          </p>
        </div>

        {/* Price */}
        <p className="text-base font-bold text-welted-accent">
          {listing.asking_price ? `$${listing.asking_price}` : 'Trade Only'}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {listing.size_us && (
            <Badge variant="muted">Size {listing.size_us}{listing.width ? listing.width : ''}</Badge>
          )}
          {listing.condition && (
            <Badge variant="muted">{listing.condition}/10</Badge>
          )}
        </div>

        {/* Seller */}
        <Link
          href={`/user/${listing.profiles?.username}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 pt-1"
        >
          <Avatar
            url={listing.profiles?.avatar_url}
            name={listing.profiles?.username || '?'}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-welted-text truncate">
              {listing.profiles?.username}
            </p>
            {reputation && reputation.total > 0 && (
              <p className="text-[10px] text-welted-text-muted">
                {reputation.total} txn · {reputation.score}%
              </p>
            )}
          </div>
        </Link>
      </div>
    </Card>
  );
}

export default function BstPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithJoins[]>([]);
  const [reputations, setReputations] = useState<Record<string, { total: number; score: number }>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedWidths, setSelectedWidths] = useState<string[]>([]);

  const activeFilterCount =
    selectedBrands.length + selectedSizes.length + selectedWidths.length;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bst_listings')
        .select('*, profiles(id, username, avatar_url), pairs(image_urls)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load listings:', error);
        setLoading(false);
        return;
      }

      const items = (data ?? []) as ListingWithJoins[];
      setListings(items);

      // Fetch reputations
      const sellerIds = [...new Set(items.map((l) => l.user_id))];
      if (sellerIds.length > 0) {
        const reps = await fetchReputationBatch(sellerIds);
        setReputations(reps);
      }

      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(l.brand)) return false;
      if (selectedSizes.length > 0 && (l.size_us === null || !selectedSizes.includes(l.size_us))) return false;
      if (selectedWidths.length > 0 && (l.width === null || !selectedWidths.includes(l.width))) return false;
      return true;
    });
  }, [listings, selectedBrands, selectedSizes, selectedWidths]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  const toggleSize = (s: number) =>
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  const toggleWidth = (w: string) =>
    setSelectedWidths((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedWidths([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-welted-bg border-b border-welted-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-welted-text">
            Buy · Sell · Trade
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilterOpen(true)}
              className="relative"
            >
              <SlidersHorizontal size={16} className="mr-1.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-welted-accent text-welted-bg text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button size="sm" onClick={() => router.push('/bst/new')}>
              <Plus size={16} className="mr-1" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <Package size={48} className="text-welted-text-muted mb-4" />
          <p className="text-welted-text font-semibold mb-1">No listings found</p>
          <p className="text-welted-text-muted text-sm">
            {activeFilterCount > 0
              ? 'Try adjusting your filters.'
              : 'Be the first to list something!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {filtered.map((listing, index) => (
            <BSTCard
              key={listing.id}
              listing={listing}
              reputation={reputations[listing.user_id]}
              priority={index < 4}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => router.push('/bst/new')}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-welted-accent text-welted-bg shadow-lg flex items-center justify-center hover:bg-welted-accent-dim transition-colors z-30 md:hidden"
      >
        <Plus size={28} />
      </button>

      {/* Filter Modal */}
      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        actions={
          activeFilterCount > 0 ? (
            <button
              onClick={clearFilters}
              className="text-xs text-welted-accent font-semibold"
            >
              Clear
            </button>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Brand */}
          <div>
            <h4 className="text-sm font-semibold text-welted-text mb-3">Brand</h4>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  selected={selectedBrands.includes(b)}
                  onClick={() => toggleBrand(b)}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h4 className="text-sm font-semibold text-welted-text mb-3">Size (US)</h4>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <Chip
                  key={s}
                  label={String(s)}
                  selected={selectedSizes.includes(s)}
                  onClick={() => toggleSize(s)}
                />
              ))}
            </div>
          </div>

          {/* Width */}
          <div>
            <h4 className="text-sm font-semibold text-welted-text mb-3">Width</h4>
            <div className="flex flex-wrap gap-2">
              {WIDTHS.map((w) => (
                <Chip
                  key={w}
                  label={w}
                  selected={selectedWidths.includes(w)}
                  onClick={() => toggleWidth(w)}
                />
              ))}
            </div>
          </div>

          <Button
            className="w-full mt-4"
            onClick={() => setFilterOpen(false)}
          >
            Show {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
