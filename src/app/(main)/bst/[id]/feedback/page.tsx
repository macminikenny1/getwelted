'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BSTListing, Profile } from '@/types';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';

type Rating = 'positive' | 'neutral' | 'negative';

const RATING_OPTIONS: { value: Rating; emoji: string; label: string; color: string }[] = [
  { value: 'positive', emoji: '\u2B50', label: 'Positive', color: 'border-welted-success bg-welted-success/10 text-welted-success' },
  { value: 'neutral', emoji: '\uD83D\uDE10', label: 'Neutral', color: 'border-welted-border bg-welted-card text-welted-text' },
  { value: 'negative', emoji: '\uD83D\uDC4E', label: 'Negative', color: 'border-welted-danger bg-welted-danger/10 text-welted-danger' },
];

interface ListingWithProfile extends BSTListing {
  profiles: Profile;
}

export default function LeaveFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxComment = 200;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bst_listings')
        .select('*, profiles(id, username, avatar_url)')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Failed to load listing:', error);
        setLoading(false);
        return;
      }

      setListing(data as ListingWithProfile);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!user || !listing || !rating) return;

    setSubmitting(true);

    const isBuyer = user.id !== listing.user_id;
    const toUserId = isBuyer ? listing.user_id : listing.user_id;
    const role = isBuyer ? 'buyer' : 'seller';

    const supabase = createClient();

    // Check if feedback already exists
    const { data: existing } = await supabase
      .from('feedback')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle();

    if (existing) {
      showToast('You already left feedback for this listing', 'error');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('feedback').insert({
      from_user_id: user.id,
      to_user_id: listing.user_id,
      listing_id: listing.id,
      rating,
      comment: comment.trim() || null,
      role,
    });

    if (error) {
      showToast('Failed to submit feedback', 'error');
      console.error(error);
    } else {
      showToast('Feedback submitted!');
      router.push(`/bst/${listing.id}`);
    }

    setSubmitting(false);
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
        <p className="text-welted-text font-semibold">Listing not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/bst')}>
          Back to BST
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-welted-bg border-b border-welted-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-welted-text">Leave Feedback</h1>
      </div>

      <div className="px-4 pt-5 space-y-6 max-w-lg mx-auto">
        {/* Listing info */}
        <div className="flex items-center gap-3">
          <Avatar
            url={listing.profiles?.avatar_url}
            name={listing.profiles?.username || '?'}
            size="lg"
          />
          <div>
            <p className="text-sm font-bold text-welted-text">
              {listing.profiles?.username}
            </p>
            <p className="text-xs text-welted-text-muted">
              {listing.brand} {listing.model}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-3">
            How was your experience?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRating(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  rating === opt.value
                    ? opt.color
                    : 'border-welted-border bg-welted-card text-welted-text-muted hover:border-welted-text-muted'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-welted-text">
              Comment (optional)
            </label>
            <span className={`text-xs ${comment.length > maxComment ? 'text-welted-danger' : 'text-welted-text-muted'}`}>
              {comment.length}/{maxComment}
            </span>
          </div>
          <textarea
            placeholder="Share details about the transaction..."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, maxComment))}
            rows={3}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!rating || submitting}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Submitting...
            </span>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </div>
    </div>
  );
}
