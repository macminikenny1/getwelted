'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchReputation, type ReputationData } from '@/lib/reputation';
import { formatTimeAgo } from '@/lib/formatTime';
import type { BSTListing, Profile } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Package, Pencil, Trash2, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ListingDetail extends BSTListing {
  profiles: Profile;
  pairs: { image_urls: string[] } | null;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwner = user?.id === listing?.user_id;

  // Combine listing images and pair images
  const allImages = [
    ...(listing?.image_urls ?? []),
    ...(listing?.pairs?.image_urls ?? []),
  ].filter(Boolean);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bst_listings')
        .select('*, profiles(id, username, avatar_url), pairs(image_urls)')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Failed to load listing:', error);
        setLoading(false);
        return;
      }

      const item = data as ListingDetail;
      setListing(item);

      const rep = await fetchReputation(item.user_id);
      setReputation(rep);

      setLoading(false);
    }
    load();
  }, [id]);

  const handleMarkSold = async () => {
    if (!listing) return;
    setActionLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('bst_listings')
      .update({ status: 'sold' })
      .eq('id', listing.id)
      .eq('user_id', user?.id);

    if (error) {
      showToast('Failed to mark as sold', 'error');
    } else {
      showToast('Listing marked as sold');
      router.push('/bst');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!listing) return;
    setActionLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('bst_listings')
      .delete()
      .eq('id', listing.id)
      .eq('user_id', user?.id);

    if (error) {
      showToast('Failed to delete listing', 'error');
    } else {
      showToast('Listing deleted');
      router.push('/bst');
    }
    setActionLoading(false);
  };

  const handleMessageSeller = async () => {
    if (!listing || !user) return;
    setActionLoading(true);
    const supabase = createClient();

    // Check for existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.user_id)
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.user_id,
      })
      .select('id')
      .single();

    if (error || !newConvo) {
      showToast('Failed to start conversation', 'error');
      setActionLoading(false);
      return;
    }

    router.push(`/messages/${newConvo.id}`);
  };

  const conditionLabels: Record<number, string> = {
    10: 'New',
    9: 'Like New',
    8: 'Excellent',
    7: 'Good',
    6: 'Fair',
    5: 'Well Worn',
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Package size={48} className="text-welted-text-muted mb-4" />
        <p className="text-welted-text font-semibold mb-1">Listing not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/bst')}>
          Back to BST
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Back button */}
      <div className="sticky top-0 z-20 bg-welted-bg border-b border-welted-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-welted-text truncate">
          {listing.brand} {listing.model}
        </h1>
      </div>

      {/* Image Carousel */}
      {allImages.length > 0 ? (
        <div>
          {/* Main Image */}
          <div className="relative aspect-square bg-welted-input-bg">
            <Image
              src={imageSrc(allImages[activeImage])}
              alt={`${listing.brand} ${listing.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((prev) => (prev - 1 + allImages.length) % allImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => (prev + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {/* Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {activeImage + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    i === activeImage
                      ? 'border-welted-accent'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={imageSrc(url)} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-welted-input-bg flex items-center justify-center">
          <Package size={48} className="text-welted-text-muted" />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4 space-y-5">
        {/* Title + Price */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-welted-text-muted">
            {listing.brand}
          </p>
          <h2 className="text-xl font-bold text-welted-text">{listing.model}</h2>
          <p className="text-2xl font-bold text-welted-accent mt-1">
            {listing.asking_price ? `$${listing.asking_price}` : 'Trade Only'}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {listing.size_us && (
            <Badge>Size {listing.size_us}</Badge>
          )}
          {listing.width && (
            <Badge>{listing.width} Width</Badge>
          )}
          {listing.condition && (
            <Badge variant="accent">
              {listing.condition}/10
              {conditionLabels[listing.condition]
                ? ` — ${conditionLabels[listing.condition]}`
                : ''}
            </Badge>
          )}
          {listing.trade_interest && (
            <Badge variant="success">Open to Trades</Badge>
          )}
          {listing.status === 'sold' && (
            <Badge variant="danger">Sold</Badge>
          )}
        </div>

        {/* Seller Card */}
        <Link href={`/user/${listing.profiles?.username}`}>
          <Card hover className="p-4 flex items-center gap-3">
            <Avatar
              url={listing.profiles?.avatar_url}
              name={listing.profiles?.username || '?'}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-welted-text">
                {listing.profiles?.username}
              </p>
              {reputation && (
                <p className="text-xs text-welted-text-muted mt-0.5">
                  {reputation.total > 0
                    ? `${reputation.total} transaction${reputation.total !== 1 ? 's' : ''} · ${reputation.score}% positive`
                    : 'No transactions yet'}
                </p>
              )}
            </div>
          </Card>
        </Link>

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="text-sm font-semibold text-welted-text mb-2">Description</h3>
            <p className="text-sm text-welted-text-muted whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Posted */}
        <p className="text-xs text-welted-text-muted">
          Listed {formatTimeAgo(listing.created_at)}
        </p>

        {/* Actions */}
        {listing.status === 'active' && (
          <div className="space-y-3 pt-2">
            {isOwner ? (
              <>
                <Button
                  className="w-full"
                  onClick={handleMarkSold}
                  disabled={actionLoading}
                >
                  Mark as Sold
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => router.push(`/bst/${listing.id}/edit`)}
                  >
                    <Pencil size={16} className="mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    <Trash2 size={16} className="mr-1.5" />
                    Delete
                  </Button>
                </div>
              </>
            ) : user ? (
              <Button
                className="w-full"
                onClick={handleMessageSeller}
                disabled={actionLoading}
              >
                <MessageCircle size={16} className="mr-1.5" />
                Message Seller
              </Button>
            ) : null}
          </div>
        )}

        {/* Feedback link for sold listings */}
        {listing.status === 'sold' && user && !isOwner && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push(`/bst/${listing.id}/feedback`)}
          >
            Leave Feedback
          </Button>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Listing"
        description="Are you sure you want to delete this listing? This action cannot be undone."
        actions={[
          { label: 'Cancel', onClick: () => {}, variant: 'cancel' },
          { label: 'Delete', onClick: handleDelete, variant: 'danger' },
        ]}
      />
    </div>
  );
}
