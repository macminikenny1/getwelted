'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/uploadImage';
import Chip from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import type { Pair } from '@/types';

const BRANDS = ['Red Wing', "Nicks", "White's", 'Viberg', 'Alden', 'Wesco', 'Truman', 'Grant Stone', 'Thursday', 'Other'];

export default function CreatePostPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [leatherType, setLeatherType] = useState('');
  const [linkToCollection, setLinkToCollection] = useState(false);
  const [selectedPair, setSelectedPair] = useState<Pair | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('pairs').select('*').eq('user_id', user.id).eq('status', 'active').order('brand');
      if (data) setPairs(data as Pair[]);
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) { showToast('Please add a photo', 'error'); return; }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const imageUrl = await uploadImage(imageFile, 'post-images', user.id);
      if (!imageUrl) throw new Error('Photo upload failed');

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: imageUrl,
        caption: caption.trim() || null,
        brand: (linkToCollection && selectedPair ? selectedPair.brand : brand.trim()) || null,
        model: (linkToCollection && selectedPair ? selectedPair.model : model.trim()) || null,
        leather_type: (linkToCollection && selectedPair ? selectedPair.leather_type : leatherType.trim()) || null,
        pair_id: linkToCollection && selectedPair ? selectedPair.id : null,
      });

      if (error) throw new Error(error.message);
      showToast('Post shared!');
      router.push('/');
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      {/* Image picker */}
      <div className="mb-6">
        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="post-image" />
        {imagePreview ? (
          <div className="relative w-full aspect-square rounded-xl overflow-hidden">
            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            <label htmlFor="post-image" className="absolute inset-0 cursor-pointer" />
          </div>
        ) : (
          <label
            htmlFor="post-image"
            className="w-full aspect-square rounded-xl border-2 border-dashed border-welted-border hover:border-welted-accent/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-welted-card"
          >
            <span className="text-5xl">📸</span>
            <span className="text-welted-text-muted text-sm font-medium">Tap to add photo</span>
          </label>
        )}
      </div>

      {/* Caption */}
      <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Caption</label>
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="Tell the story of this pair..."
        className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none h-20 resize-none transition-colors"
      />

      {/* Link toggle */}
      <div className="flex items-center justify-between mt-6 py-4 border-t border-welted-border">
        <div>
          <p className="text-welted-text font-semibold text-sm">Link to Patina Timeline</p>
          <p className="text-welted-text-muted text-xs mt-0.5">Add to a pair&apos;s timeline in your collection</p>
        </div>
        <button
          type="button"
          onClick={() => setLinkToCollection(!linkToCollection)}
          className={`w-11 h-6 rounded-full transition-colors ${linkToCollection ? 'bg-welted-accent' : 'bg-welted-border'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${linkToCollection ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Pair selector or brand/model fields */}
      {linkToCollection ? (
        <div className="mt-4">
          <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Select Pair</label>
          {pairs.length === 0 ? (
            <p className="text-welted-text-muted text-sm">No pairs in your collection yet.</p>
          ) : (
            <div className="space-y-2">
              {pairs.map(pair => (
                <button
                  key={pair.id}
                  onClick={() => setSelectedPair(pair)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    selectedPair?.id === pair.id
                      ? 'border-welted-accent bg-welted-accent/5'
                      : 'border-welted-border bg-welted-card hover:bg-welted-card-hover'
                  }`}
                >
                  {pair.image_urls?.[0] && (
                    <Image src={imageSrc(pair.image_urls[0])} alt={pair.model} width={44} height={44} className="rounded-md object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${selectedPair?.id === pair.id ? 'text-welted-accent' : 'text-welted-text-muted'}`}>{pair.brand}</p>
                    <p className="text-sm font-semibold text-welted-text truncate">{pair.model}</p>
                  </div>
                  {selectedPair?.id === pair.id && <span className="text-welted-accent font-bold text-lg">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Brand</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {BRANDS.map(b => (
                <Chip key={b} label={b} selected={brand === b} onClick={() => setBrand(b)} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Model</label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="e.g. Iron Ranger 8111"
              className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Leather Type</label>
            <input
              value={leatherType}
              onChange={e => setLeatherType(e.target.value)}
              placeholder="e.g. Amber Harness, CXL"
              className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 p-4 bg-welted-bg border-t border-welted-border z-30">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? <Spinner size="sm" /> : 'Share Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}
