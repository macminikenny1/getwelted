'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadImages } from '@/lib/uploadImage';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ImageUpload from '@/components/ui/ImageUpload';
import Spinner from '@/components/ui/Spinner';

const KNOWN_BRANDS = [
  'Red Wing', "Nicks", "White's", 'Viberg', 'Alden', 'Wesco',
  'Truman', 'Grant Stone', 'Thursday', 'Thorogood', 'Parkhurst',
  'Carmina', 'Crockett & Jones', 'Edward Green', 'John Lofgren', 'Role Club',
  'Grenson', "Tricker's",
];

export default function AddPairPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Form state
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [leatherType, setLeatherType] = useState('');
  const [colorway, setColorway] = useState('');
  const [sizeUs, setSizeUs] = useState('');
  const [width, setWidth] = useState('');
  const [status, setStatus] = useState<'active' | 'on_order'>('active');
  const [isRoughout, setIsRoughout] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [condition, setCondition] = useState('10');
  const [notes, setNotes] = useState('');

  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Brand autocomplete
  const [brandFocused, setBrandFocused] = useState(false);
  const [userBrands, setUserBrands] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's past brands for autocomplete
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('pairs')
      .select('brand')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const brands = [...new Set(data.map((p: { brand: string }) => p.brand))];
          setUserBrands(brands);
        }
      });
  }, [user]);

  const allBrands = useMemo(() => {
    const combined = [...new Set([...KNOWN_BRANDS, ...userBrands])];
    return combined.sort();
  }, [userBrands]);

  const filteredBrands = useMemo(() => {
    if (!brand.trim()) return allBrands;
    const lower = brand.toLowerCase();
    return allBrands.filter((b) => b.toLowerCase().includes(lower));
  }, [brand, allBrands]);

  const handleAddImages = (files: File[]) => {
    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);
    const newPreviews = newImages.map((f) => URL.createObjectURL(f));
    // Revoke old object URLs
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(newPreviews);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!brand.trim() || !model.trim()) {
      showToast('Brand and model are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images, 'post-images', user.id);
      }

      // Insert pair
      const pairData = {
        user_id: user.id,
        brand: brand.trim(),
        model: model.trim(),
        leather_type: leatherType.trim() || null,
        colorway: colorway.trim() || null,
        size_us: sizeUs ? parseFloat(sizeUs) : null,
        width: width.trim() || null,
        status,
        is_roughout: isRoughout,
        is_public: isPublic,
        condition: condition ? parseInt(condition) : null,
        notes: notes.trim() || null,
        image_urls: imageUrls,
        wear_count: 0,
      };

      const { data: pair, error } = await supabase
        .from('pairs')
        .insert(pairData)
        .select()
        .single();

      if (error) throw error;

      // If public and has images, create a post
      if (isPublic && imageUrls.length > 0 && pair) {
        await supabase.from('posts').insert({
          user_id: user.id,
          pair_id: pair.id,
          caption: `Added ${brand.trim()} ${model.trim()} to my collection`,
          image_url: imageUrls[0],
          brand: brand.trim(),
          model: model.trim(),
          leather_type: leatherType.trim() || null,
        });
      }

      showToast('Pair added to collection!');
      router.push('/collection');
    } catch (err) {
      console.error(err);
      showToast('Failed to add pair. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const inputClass =
    'w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:border-welted-accent transition-colors';

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/collection" className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-welted-text">Add Pair</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">Photos</label>
          <ImageUpload
            images={images}
            previews={previews}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            maxImages={10}
          />
        </div>

        {/* Brand with autocomplete */}
        <div className="relative">
          <label className="block text-sm font-semibold text-welted-text mb-2">Brand *</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            onFocus={() => setBrandFocused(true)}
            onBlur={() => setTimeout(() => setBrandFocused(false), 200)}
            placeholder="e.g. Red Wing, Viberg"
            className={inputClass}
            required
          />
          {brandFocused && filteredBrands.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-welted-card border border-welted-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setBrand(b);
                    setBrandFocused(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-welted-text hover:bg-welted-card-hover transition-colors"
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">Model *</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Iron Ranger 8111"
            className={inputClass}
            required
          />
        </div>

        {/* Leather Type */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">Leather Type</label>
          <input
            type="text"
            value={leatherType}
            onChange={(e) => setLeatherType(e.target.value)}
            placeholder="e.g. Chromexcel, Shell Cordovan"
            className={inputClass}
          />
        </div>

        {/* Colorway */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">Colorway</label>
          <input
            type="text"
            value={colorway}
            onChange={(e) => setColorway(e.target.value)}
            placeholder="e.g. Amber Harness, Black"
            className={inputClass}
          />
        </div>

        {/* Size + Width side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Size (US)</label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="16"
              value={sizeUs}
              onChange={(e) => setSizeUs(e.target.value)}
              placeholder="10"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="e.g. D, EE"
              className={inputClass}
            />
          </div>
        </div>

        {/* Status chips */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">Status</label>
          <div className="flex gap-2">
            <Chip label="Active" selected={status === 'active'} onClick={() => setStatus('active')} />
            <Chip label="On Order" selected={status === 'on_order'} onClick={() => setStatus('on_order')} />
          </div>
        </div>

        {/* Is Roughout toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-welted-text">Roughout / Suede</p>
            <p className="text-xs text-welted-text-muted mt-0.5">Flesh-side out leather</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRoughout(!isRoughout)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isRoughout ? 'bg-welted-accent' : 'bg-welted-input-bg border border-welted-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isRoughout ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Is Public toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-welted-text">Share with Community</p>
            <p className="text-xs text-welted-text-muted mt-0.5">Post to feed when added</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isPublic ? 'bg-welted-accent' : 'bg-welted-input-bg border border-welted-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">
            Condition <span className="text-welted-text-muted font-normal">(1-10)</span>
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className={`${inputClass} max-w-24`}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-welted-text mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details about this pair..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            'Add to Collection'
          )}
        </Button>
      </form>
    </div>
  );
}
