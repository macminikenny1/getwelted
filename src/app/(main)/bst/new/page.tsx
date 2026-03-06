'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImages } from '@/lib/uploadImage';
import type { Pair } from '@/types';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ImageUpload from '@/components/ui/ImageUpload';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const BRANDS = [
  'Alden', 'Viberg', 'White\'s', 'Nicks', 'Red Wing',
  'Grant Stone', 'Parkhurst', 'Truman', 'Wesco', 'Crockett & Jones',
  'Grenson', 'Tricker\'s',
];

const CONDITIONS = [
  { value: 10, label: 'New', desc: 'Unworn, in original packaging' },
  { value: 9, label: 'Like New', desc: 'Worn once or twice, no visible wear' },
  { value: 8, label: 'Excellent', desc: 'Light wear, minimal creasing' },
  { value: 7, label: 'Good', desc: 'Moderate wear, normal creasing' },
  { value: 6, label: 'Fair', desc: 'Noticeable wear, scuffs or marks' },
  { value: 5, label: 'Well Worn', desc: 'Heavy wear, may need resoling' },
];

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  // Form state
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [usePair, setUsePair] = useState(false);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
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

  // Load user pairs for "use from collection"
  useEffect(() => {
    if (!user) return;
    async function loadPairs() {
      const supabase = createClient();
      const { data } = await supabase
        .from('pairs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setPairs(data ?? []);
    }
    loadPairs();
  }, [user]);

  // Auto-fill from pair
  useEffect(() => {
    if (!selectedPairId) return;
    const pair = pairs.find((p) => p.id === selectedPairId);
    if (!pair) return;
    if (BRANDS.includes(pair.brand)) {
      setBrand(pair.brand);
      setCustomBrand('');
    } else {
      setBrand('');
      setCustomBrand(pair.brand);
    }
    setModel(pair.model);
    if (pair.size_us) setSizeUs(String(pair.size_us));
    if (pair.width) setWidth(pair.width);
    if (pair.condition) setCondition(pair.condition);
  }, [selectedPairId, pairs]);

  const handleAddImages = (files: File[]) => {
    const newImages = [...images, ...files].slice(0, 6);
    setImages(newImages);
    const newPreviews = newImages.map((f) => URL.createObjectURL(f));
    // Clean up old previews
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews(newPreviews);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleReplaceImage = (index: number, file: File, preview: string) => {
    URL.revokeObjectURL(previews[index]);
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages[index] = file;
    newPreviews[index] = preview;
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!effectiveBrand.trim() || !model.trim()) {
      showToast('Brand and model are required', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images, 'bst-images', user.id);
      }

      const supabase = createClient();
      const { error } = await supabase.from('bst_listings').insert({
        user_id: user.id,
        pair_id: selectedPairId,
        brand: effectiveBrand.trim(),
        model: model.trim(),
        size_us: sizeUs ? parseFloat(sizeUs) : null,
        width: width || null,
        condition,
        asking_price: askingPrice ? parseFloat(askingPrice) : null,
        trade_interest: tradeInterest,
        description: description.trim() || null,
        image_urls: imageUrls,
        status: 'active',
      });

      if (error) {
        showToast('Failed to create listing', 'error');
        console.error(error);
      } else {
        showToast('Listing posted!');
        router.push('/bst');
      }
    } catch (err) {
      showToast('Something went wrong', 'error');
      console.error(err);
    }

    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-welted-text font-semibold mb-2">Sign in to create a listing</p>
        <Button onClick={() => router.push('/login')}>Sign In</Button>
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
        <h1 className="text-base font-bold text-welted-text">Create Listing</h1>
      </div>

      <div className="px-4 pt-5 space-y-6 max-w-lg mx-auto">
        {/* Images */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Photos
          </label>
          <ImageUpload
            images={images}
            previews={previews}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            onReplace={handleReplaceImage}
            maxImages={6}
          />
        </div>

        {/* Use pair from collection */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-welted-text">
              Use pair from collection
            </label>
            <button
              type="button"
              onClick={() => {
                setUsePair(!usePair);
                if (usePair) {
                  setSelectedPairId(null);
                }
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                usePair ? 'bg-welted-accent' : 'bg-welted-input-bg'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  usePair ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {usePair && (
            <div className="mt-3 relative">
              <button
                type="button"
                onClick={() => setPairDropdownOpen(!pairDropdownOpen)}
                className="w-full flex items-center justify-between bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-sm text-welted-text"
              >
                <span className={selectedPairId ? 'text-welted-text' : 'text-welted-text-muted'}>
                  {selectedPairId
                    ? (() => {
                        const p = pairs.find((x) => x.id === selectedPairId);
                        return p ? `${p.brand} ${p.model}` : 'Select a pair';
                      })()
                    : 'Select a pair'}
                </span>
                <ChevronDown size={16} className="text-welted-text-muted" />
              </button>
              {pairDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-welted-card border border-welted-border rounded-lg max-h-48 overflow-y-auto z-10 shadow-lg">
                  {pairs.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-welted-text-muted">No pairs in collection</p>
                  ) : (
                    pairs.map((pair) => (
                      <button
                        key={pair.id}
                        type="button"
                        onClick={() => {
                          setSelectedPairId(pair.id);
                          setPairDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-welted-input-bg transition-colors border-b border-welted-border last:border-0"
                      >
                        <span className="font-semibold text-welted-text">{pair.brand}</span>{' '}
                        <span className="text-welted-text-muted">{pair.model}</span>
                        {pair.size_us && (
                          <span className="text-welted-text-muted"> · Size {pair.size_us}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
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

        {/* Disclaimer */}
        <p className="text-xs text-welted-text-muted leading-relaxed">
          By posting this listing, you confirm that you own the item and that all details
          are accurate. Welted is not responsible for transactions between users. Always
          use payment methods with buyer protection.
        </p>

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !effectiveBrand.trim() || !model.trim()}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Posting...
            </span>
          ) : (
            'Post Listing'
          )}
        </Button>
      </div>
    </div>
  );
}
