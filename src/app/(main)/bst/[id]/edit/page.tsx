'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImages } from '@/lib/uploadImage';
import type { BSTListing } from '@/types';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ImageUpload from '@/components/ui/ImageUpload';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, X } from 'lucide-react';

const BRANDS = [
  'Alden', 'Viberg', 'White\'s', 'Nick\'s', 'Red Wing',
  'Grant Stone', 'Parkhurst', 'Truman', 'Wesco', 'Crockett & Jones',
];

const CONDITIONS = [
  { value: 10, label: 'New', desc: 'Unworn, in original packaging' },
  { value: 9, label: 'Like New', desc: 'Worn once or twice, no visible wear' },
  { value: 8, label: 'Excellent', desc: 'Light wear, minimal creasing' },
  { value: 7, label: 'Good', desc: 'Moderate wear, normal creasing' },
  { value: 6, label: 'Fair', desc: 'Noticeable wear, scuffs or marks' },
  { value: 5, label: 'Well Worn', desc: 'Heavy wear, may need resoling' },
];

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<BSTListing | null>(null);

  // Form state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [sizeUs, setSizeUs] = useState('');
  const [width, setWidth] = useState('');
  const [condition, setCondition] = useState<number | null>(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [tradeInterest, setTradeInterest] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const effectiveBrand = brand || customBrand;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bst_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Failed to load listing:', error);
        setLoading(false);
        return;
      }

      const item = data as BSTListing;
      setListing(item);
      setExistingImages(item.image_urls ?? []);

      if (BRANDS.includes(item.brand)) {
        setBrand(item.brand);
      } else {
        setCustomBrand(item.brand);
      }
      setModel(item.model);
      if (item.size_us) setSizeUs(String(item.size_us));
      if (item.width) setWidth(item.width);
      setCondition(item.condition);
      if (item.asking_price) setAskingPrice(String(item.asking_price));
      setTradeInterest(item.trade_interest);
      setDescription(item.description ?? '');

      setLoading(false);
    }
    load();
  }, [id]);

  const handleAddImages = (files: File[]) => {
    const totalCount = existingImages.length + newImages.length;
    const maxNew = 6 - totalCount;
    const toAdd = files.slice(0, maxNew);
    const updated = [...newImages, ...toAdd];
    setNewImages(updated);
    newPreviews.forEach((p) => URL.revokeObjectURL(p));
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !listing) return;
    if (!effectiveBrand.trim() || !model.trim()) {
      showToast('Brand and model are required', 'error');
      return;
    }

    setSubmitting(true);

    try {
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = await uploadImages(newImages, 'bst-images', user.id);
      }

      const allImageUrls = [...existingImages, ...uploadedUrls];

      const supabase = createClient();
      const { error } = await supabase
        .from('bst_listings')
        .update({
          brand: effectiveBrand.trim(),
          model: model.trim(),
          size_us: sizeUs ? parseFloat(sizeUs) : null,
          width: width || null,
          condition,
          asking_price: askingPrice ? parseFloat(askingPrice) : null,
          trade_interest: tradeInterest,
          description: description.trim() || null,
          image_urls: allImageUrls,
        })
        .eq('id', listing.id)
        .eq('user_id', user.id);

      if (error) {
        showToast('Failed to update listing', 'error');
        console.error(error);
      } else {
        showToast('Listing updated!');
        router.push(`/bst/${listing.id}`);
      }
    } catch (err) {
      showToast('Something went wrong', 'error');
      console.error(err);
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

  if (!listing || (user && listing.user_id !== user.id)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-welted-text font-semibold mb-2">Listing not found or not authorized</p>
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
        <h1 className="text-base font-bold text-welted-text">Edit Listing</h1>
      </div>

      <div className="px-4 pt-5 space-y-6 max-w-lg mx-auto">
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">
              Current Photos
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {existingImages.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="96px" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(i)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Add More Photos
          </label>
          <ImageUpload
            images={newImages}
            previews={newPreviews}
            onAdd={handleAddImages}
            onRemove={handleRemoveNewImage}
            maxImages={6 - existingImages.length}
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Brand
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {BRANDS.map((b) => (
              <Chip
                key={b}
                label={b}
                selected={brand === b}
                onClick={() => {
                  setBrand(brand === b ? '' : b);
                  if (brand !== b) setCustomBrand('');
                }}
              />
            ))}
          </div>
          <input
            type="text"
            placeholder="Or enter brand name..."
            value={customBrand}
            onChange={(e) => {
              setCustomBrand(e.target.value);
              setBrand('');
            }}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Model
          </label>
          <input
            type="text"
            placeholder="e.g. Service Boot, Iron Ranger, 975..."
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent"
          />
        </div>

        {/* Size + Width */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-welted-text mb-2">
              Size (US)
            </label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="18"
              placeholder="e.g. 10"
              value={sizeUs}
              onChange={(e) => setSizeUs(e.target.value)}
              className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-welted-text mb-2">
              Width
            </label>
            <select
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text focus:outline-none focus:border-welted-accent appearance-none"
            >
              <option value="">Select</option>
              {['B', 'C', 'D', 'E', 'EE', 'EEE'].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Condition
          </label>
          <div className="space-y-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCondition(c.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                  condition === c.value
                    ? 'border-welted-accent bg-welted-accent/10'
                    : 'border-welted-border bg-welted-input-bg hover:border-welted-text-muted'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    condition === c.value
                      ? 'border-welted-accent'
                      : 'border-welted-border'
                  }`}
                >
                  {condition === c.value && (
                    <span className="w-2.5 h-2.5 rounded-full bg-welted-accent" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-welted-text">
                    {c.value}/10 — {c.label}
                  </p>
                  <p className="text-xs text-welted-text-muted">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Asking Price */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Asking Price ($)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Leave empty for trade only"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent"
          />
        </div>

        {/* Trade Interest */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-welted-text">
            Open to Trades
          </label>
          <button
            type="button"
            onClick={() => setTradeInterest(!tradeInterest)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              tradeInterest ? 'bg-welted-accent' : 'bg-welted-input-bg'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                tradeInterest ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Description
          </label>
          <textarea
            placeholder="Details about the boots — wear history, fit notes, what's included..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text placeholder:text-welted-text-muted focus:outline-none focus:border-welted-accent resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !effectiveBrand.trim() || !model.trim()}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
