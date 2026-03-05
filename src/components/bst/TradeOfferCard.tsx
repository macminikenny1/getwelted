'use client';

import Image from 'next/image';
import { imageSrc } from '@/lib/imageSrc';
import type { TradeOffer } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeftRight, Check, X, Clock, Star, Package, Undo2 } from 'lucide-react';

interface TradeOfferCardProps {
  offer: TradeOffer;
  currentUserId: string;
  listingBrand?: string;
  listingModel?: string;
  onAccept?: (offerId: string) => void;
  onDecline?: (offerId: string) => void;
  onRescind?: (offerId: string) => void;
  onConfirmReceipt?: (offerId: string) => void;
  onLeaveFeedback?: () => void;
  hasFeedback?: boolean;
  loading?: boolean;
}

export default function TradeOfferCard({
  offer,
  currentUserId,
  listingBrand,
  listingModel,
  onAccept,
  onDecline,
  onRescind,
  onConfirmReceipt,
  onLeaveFeedback,
  hasFeedback = false,
  loading = false,
}: TradeOfferCardProps) {
  const isProposer = offer.proposer_id === currentUserId;
  const isListingOwner = offer.listing_owner_id === currentUserId;
  const pair = offer.offered_pair;
  const pairImage = pair?.image_urls?.[0];
  const bothConfirmed = offer.proposer_confirmed && offer.owner_confirmed;
  const userConfirmed = isProposer ? offer.proposer_confirmed : offer.owner_confirmed;

  return (
    <div className="bg-welted-card border border-welted-border rounded-2xl p-4 space-y-3 max-w-[85%]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={16} className="text-welted-accent" />
        <span className="text-xs font-bold text-welted-accent uppercase tracking-wider">
          Trade Offer
        </span>
        <Badge
          variant={
            offer.status === 'pending' ? 'accent' :
            offer.status === 'accepted' ? 'success' :
            offer.status === 'declined' || offer.status === 'rescinded' ? 'danger' :
            'success'
          }
        >
          {bothConfirmed ? 'Complete' : offer.status}
        </Badge>
      </div>

      {/* Offered Pair Info */}
      {pair && (
        <div className="flex items-center gap-3 bg-welted-input-bg rounded-xl p-3">
          {pairImage ? (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-welted-bg">
              <Image
                src={imageSrc(pairImage)}
                alt={`${pair.brand} ${pair.model}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-welted-bg flex items-center justify-center shrink-0">
              <Package size={20} className="text-welted-text-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-welted-text-muted uppercase tracking-wider font-semibold">
              {pair.brand}
            </p>
            <p className="text-sm font-bold text-welted-text truncate">
              {pair.model}
            </p>
            <p className="text-xs text-welted-text-muted">
              {pair.size_us ? `US ${pair.size_us}` : ''}
              {pair.width ? ` ${pair.width}` : ''}
              {pair.condition ? ` · ${pair.condition}/10` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Trade direction */}
      <p className="text-xs text-welted-text-muted text-center">
        {isProposer ? 'You offered' : 'Offered'} for {listingBrand} {listingModel}
      </p>

      {/* Actions based on status */}
      {offer.status === 'pending' && (
        <div>
          {isListingOwner && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept?.(offer.id)}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : <><Check size={14} className="mr-1" /> Accept</>}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => onDecline?.(offer.id)}
                disabled={loading}
              >
                <X size={14} className="mr-1" /> Decline
              </Button>
            </div>
          )}
          {isProposer && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-welted-text-muted">
                <Clock size={14} />
                <span className="text-xs">Awaiting response...</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onRescind?.(offer.id)}
                disabled={loading}
              >
                <Undo2 size={14} className="mr-1" /> Rescind Offer
              </Button>
            </div>
          )}
        </div>
      )}

      {offer.status === 'accepted' && !bothConfirmed && (
        <div className="space-y-2">
          <p className="text-xs text-welted-success font-semibold text-center">
            Trade accepted! Ship your boots and confirm when you receive theirs.
          </p>
          {!userConfirmed ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onConfirmReceipt?.(offer.id)}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : <><Check size={14} className="mr-1" /> Confirm Receipt</>}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-welted-success">
              <Check size={14} />
              <span className="text-xs font-semibold">
                You confirmed receipt. Waiting for the other party...
              </span>
            </div>
          )}
        </div>
      )}

      {bothConfirmed && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-welted-success">
            <Check size={16} />
            <span className="text-sm font-bold">Trade Complete!</span>
          </div>
          {!hasFeedback && onLeaveFeedback && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={onLeaveFeedback}
            >
              <Star size={14} className="mr-1" /> Leave Feedback
            </Button>
          )}
        </div>
      )}

      {offer.status === 'declined' && (
        <p className="text-xs text-welted-danger text-center font-semibold">
          Trade offer was declined.
        </p>
      )}

      {offer.status === 'rescinded' && (
        <p className="text-xs text-welted-text-muted text-center font-semibold">
          Trade offer was rescinded.
        </p>
      )}
    </div>
  );
}
