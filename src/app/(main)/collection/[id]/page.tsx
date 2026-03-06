'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Edit3, Trash2, Plus, Minus, Save, X, Camera, Loader2,
  Droplets, ScrollText, Wrench, Package, ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import { uploadImages } from '@/lib/uploadImage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import type { Pair, Post, CareLogEntry } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'accent' | 'success' | 'muted' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  on_order: { label: 'On Order', variant: 'accent' },
  stored: { label: 'Stored', variant: 'muted' },
  sold: { label: 'Sold', variant: 'danger' },
};

export default function PairDetailPage() {
  const params = useParams();
  const pairId = params.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [pair, setPair] = useState<Pair | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [careLogs, setCareLogs] = useState<CareLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Editable fields
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editLeatherType, setEditLeatherType] = useState('');
  const [editColorway, setEditColorway] = useState('');
  const [editSizeUs, setEditSizeUs] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Image editing
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [pairRes, postsRes, careRes] = await Promise.all([
      supabase.from('pairs').select('*').eq('id', pairId).single(),
      supabase.from('posts').select('*').eq('pair_id', pairId).order('created_at', { ascending: true }),
      supabase.from('care_log').select('*').eq('pair_id', pairId).order('created_at', { ascending: false }).limit(3),
    ]);

    if (pairRes.data) {
      const p = pairRes.data as Pair;
      setPair(p);
      setEditBrand(p.brand);
      setEditModel(p.model);
      setEditLeatherType(p.leather_type || '');
      setEditColorway(p.colorway || '');
      setEditSizeUs(p.size_us?.toString() || '');
      setEditWidth(p.width || '');
      setEditCondition(p.condition?.toString() || '');
      setEditStatus(p.status);
      setEditNotes(p.notes || '');
    }
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    if (careRes.data) setCareLogs(careRes.data as CareLogEntry[]);

    setLoading(false);
  }, [pairId]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const handleWearIncrement = async (delta: number) => {
    if (!pair) return;
    const newCount = Math.max(0, pair.wear_count + delta);
    setPair({ ...pair, wear_count: newCount });

    const supabase = createClient();
    await supabase.from('pairs').update({ wear_count: newCount }).eq('id', pair.id).eq('user_id', user?.id);
  };

  // handleSaveEdit is now replaced by handleSaveWithImages which also handles photo changes

  const handleDelete = async () => {
    if (!pair) return;
    const supabase = createClient();
    const { error } = await supabase.from('pairs').delete().eq('id', pair.id).eq('user_id', user?.id);
    if (error) {
      showToast('Failed to delete pair.', 'error');
    } else {
      showToast('Pair deleted.');
      router.push('/collection');
    }
  };

  const nextImage = () => {
    if (!pair?.image_urls?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % pair.image_urls.length);
  };

  const prevImage = () => {
    if (!pair?.image_urls?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + pair.image_urls.length) % pair.image_urls.length);
  };

  const handleSetCover = async (index: number) => {
    if (!pair || index === 0) return;
    const url = pair.image_urls[index];
    const reordered = [url, ...pair.image_urls.filter((_, i) => i !== index)];
    setPair({ ...pair, image_urls: reordered });
    setCurrentImageIndex(0);

    const supabase = createClient();
    const { error } = await supabase
      .from('pairs')
      .update({ image_urls: reordered })
      .eq('id', pair.id)
      .eq('user_id', user?.id);

    if (error) {
      showToast('Failed to set cover photo.', 'error');
      fetchData(); // Revert on failure
    } else {
      showToast('Cover photo updated!');
    }
  };

  // Reset image editing state when entering/leaving edit mode
  const startEditing = () => {
    setEditing(true);
    setNewImages([]);
    setNewPreviews([]);
    setRemovedUrls([]);
  };

  const cancelEditing = () => {
    setEditing(false);
    setNewImages([]);
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewPreviews([]);
    setRemovedUrls([]);
  };

  const handleAddNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const currentTotal = (pair?.image_urls?.length || 0) - removedUrls.length + newImages.length;
    const remaining = 10 - currentTotal;
    const toAdd = files.slice(0, remaining);
    setNewImages((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveExistingImage = (url: string) => {
    setRemovedUrls((prev) => [...prev, url]);
    if (pair?.image_urls[currentImageIndex] === url) {
      setCurrentImageIndex(0);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveWithImages = async () => {
    if (!pair || !user) return;
    setUploadingImages(true);

    try {
      const supabase = createClient();

      // Upload new images
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = await uploadImages(newImages, 'post-images', user.id);
      }

      // Combine: existing (minus removed) + new uploads
      const keptUrls = (pair.image_urls || []).filter((url) => !removedUrls.includes(url));
      const finalUrls = [...keptUrls, ...uploadedUrls];

      const { error } = await supabase
        .from('pairs')
        .update({
          brand: editBrand.trim(),
          model: editModel.trim(),
          leather_type: editLeatherType.trim() || null,
          colorway: editColorway.trim() || null,
          size_us: editSizeUs ? parseFloat(editSizeUs) : null,
          width: editWidth.trim() || null,
          condition: editCondition ? parseInt(editCondition) : null,
          status: editStatus,
          notes: editNotes.trim() || null,
          image_urls: finalUrls,
        })
        .eq('id', pair.id)
        .eq('user_id', user.id);

      if (error) throw error;

      showToast('Changes saved!');
      setEditing(false);
      setNewImages([]);
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewPreviews([]);
      setRemovedUrls([]);
      setCurrentImageIndex(0);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save changes.', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  // Compute visible images for edit mode
  const existingImages = (pair?.image_urls || []).filter((url) => !removedUrls.includes(url));
  const totalImageCount = existingImages.length + newImages.length;
  const canAddMoreImages = totalImageCount < 10;

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="p-4 text-center">
        <p className="text-welted-text-muted">Pair not found.</p>
        <Link href="/collection" className="text-welted-accent text-sm mt-2 inline-block">
          Back to Collection
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[pair.status] || STATUS_CONFIG.active;
  const inputClass =
    'w-full bg-welted-input-bg border border-welted-border rounded-lg px-3 py-2 text-sm text-welted-text focus:outline-none focus:border-welted-accent transition-colors';

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/collection" className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X size={16} className="mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveWithImages} disabled={uploadingImages}>
                {uploadingImages ? (
                  <><Loader2 size={16} className="mr-1 animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} className="mr-1" /> Save</>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Edit3 size={16} />
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Image Carousel / Editor */}
      {editing ? (
        <div className="mb-5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddNewImages}
            className="hidden"
          />
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Existing images (minus removed) */}
            {existingImages.map((url) => (
              <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                <Image src={imageSrc(url)} alt="Existing" fill className="object-cover" sizes="96px" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(url)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {/* New images being added */}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 ring-2 ring-welted-accent/50">
                <Image src={src} alt={`New ${i + 1}`} fill className="object-cover" sizes="96px" />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {/* Add button */}
            {canAddMoreImages && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-welted-border hover:border-welted-accent/50 flex flex-col items-center justify-center shrink-0 transition-colors gap-1"
              >
                <Camera size={20} className="text-welted-text-muted" />
                <span className="text-[10px] text-welted-text-muted">Add</span>
              </button>
            )}
          </div>
          <p className="text-welted-text-muted text-xs mt-2">{totalImageCount}/10 photos</p>
        </div>
      ) : pair.image_urls?.length > 0 ? (
        <div className="mb-5">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-welted-input-bg">
            <Image
              src={imageSrc(pair.image_urls[currentImageIndex])}
              alt={`${pair.brand} ${pair.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
            {pair.image_urls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-1.5 transition-colors"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {pair.image_urls.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {pair.image_urls.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    i === currentImageIndex ? 'border-welted-accent' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={imageSrc(url)} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="64px" />
                  {i === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 flex items-center justify-center py-0.5">
                      <Star size={10} className="text-welted-accent fill-welted-accent" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {/* Set as Cover button */}
          {pair.image_urls.length > 1 && currentImageIndex !== 0 && (
            <button
              onClick={() => handleSetCover(currentImageIndex)}
              className="flex items-center gap-1.5 mt-2 text-xs text-welted-accent hover:text-welted-text transition-colors"
            >
              <Star size={12} />
              Set as cover photo
            </button>
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] rounded-xl bg-welted-input-bg flex items-center justify-center mb-5">
          <Package size={48} className="text-welted-text-muted/30" />
        </div>
      )}

      {/* Brand + Model */}
      {editing ? (
        <div className="space-y-3 mb-5">
          <input value={editBrand} onChange={(e) => setEditBrand(e.target.value)} placeholder="Brand" className={inputClass} />
          <input value={editModel} onChange={(e) => setEditModel(e.target.value)} placeholder="Model" className={inputClass} />
        </div>
      ) : (
        <div className="mb-5">
          <p className="text-welted-text-muted text-xs font-semibold uppercase tracking-wider">{pair.brand}</p>
          <h2 className="text-2xl font-bold text-welted-text mt-0.5">{pair.model}</h2>
        </div>
      )}

      {/* Info Grid */}
      {editing ? (
        <Card className="p-4 mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-welted-text-muted mb-1 block">Size (US)</label>
              <input value={editSizeUs} onChange={(e) => setEditSizeUs(e.target.value)} type="number" step="0.5" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-welted-text-muted mb-1 block">Width</label>
              <input value={editWidth} onChange={(e) => setEditWidth(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-welted-text-muted mb-1 block">Colorway</label>
            <input value={editColorway} onChange={(e) => setEditColorway(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-welted-text-muted mb-1 block">Leather Type</label>
            <input value={editLeatherType} onChange={(e) => setEditLeatherType(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-welted-text-muted mb-1 block">Condition (1-10)</label>
              <input value={editCondition} onChange={(e) => setEditCondition(e.target.value)} type="number" min="1" max="10" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-welted-text-muted mb-1 block">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="on_order">On Order</option>
                <option value="stored">Stored</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 mb-5">
          <div className="grid grid-cols-3 gap-y-4 gap-x-3">
            <InfoCell label="Size" value={pair.size_us ? `US ${pair.size_us}` : '--'} />
            <InfoCell label="Width" value={pair.width || '--'} />
            <InfoCell label="Condition" value={pair.condition ? `${pair.condition}/10` : '--'} />
            <InfoCell label="Colorway" value={pair.colorway || '--'} />
            <InfoCell label="Status" value={<Badge variant={status.variant}>{status.label}</Badge>} />
            <InfoCell label="Leather" value={pair.leather_type || '--'} />
          </div>
          {pair.is_roughout && (
            <div className="mt-3 pt-3 border-t border-welted-border">
              <Badge variant="muted">Roughout / Flesh-side</Badge>
            </div>
          )}
        </Card>
      )}

      {/* Wear Counter */}
      <Card className="p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-welted-text">Wear Count</p>
            <p className="text-3xl font-bold text-welted-accent mt-1">{pair.wear_count}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleWearIncrement(-1)}
              disabled={pair.wear_count <= 0}
              className="w-10 h-10 rounded-full bg-welted-input-bg border border-welted-border flex items-center justify-center hover:bg-welted-card-hover disabled:opacity-30 transition-colors"
            >
              <Minus size={18} className="text-welted-text" />
            </button>
            <button
              onClick={() => handleWearIncrement(1)}
              className="w-10 h-10 rounded-full bg-welted-accent/15 border border-welted-accent/30 flex items-center justify-center hover:bg-welted-accent/25 transition-colors"
            >
              <Plus size={18} className="text-welted-accent" />
            </button>
          </div>
        </div>
      </Card>

      {/* Navigation Links */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Link href={`/collection/${pairId}/care?brand=${encodeURIComponent(pair.brand)}&model=${encodeURIComponent(pair.model)}&leatherType=${encodeURIComponent(pair.leather_type || '')}&isRoughout=${pair.is_roughout}`}>
          <Card hover className="p-3 text-center">
            <Droplets size={20} className="text-welted-accent mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-welted-text">Care Advisor</p>
          </Card>
        </Link>
        <Link href={`/collection/${pairId}/care-log`}>
          <Card hover className="p-3 text-center">
            <ScrollText size={20} className="text-welted-accent mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-welted-text">Care Log</p>
          </Card>
        </Link>
        <Link href={`/collection/${pairId}/resole-log`}>
          <Card hover className="p-3 text-center">
            <Wrench size={20} className="text-welted-accent mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-welted-text">Resole Log</p>
          </Card>
        </Link>
      </div>

      {/* Notes */}
      {editing ? (
        <div className="mb-5">
          <label className="text-sm font-semibold text-welted-text mb-2 block">Notes</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      ) : pair.notes ? (
        <Card className="p-4 mb-5">
          <p className="text-sm font-semibold text-welted-text mb-1">Notes</p>
          <p className="text-sm text-welted-text-muted whitespace-pre-wrap">{pair.notes}</p>
        </Card>
      ) : null}

      {/* Recent Care Log */}
      {careLogs.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-welted-text">Recent Care</p>
            <Link href={`/collection/${pairId}/care-log`} className="text-xs text-welted-accent">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {careLogs.map((entry) => (
              <Card key={entry.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-welted-text capitalize">{entry.event_type}</p>
                    {entry.products_used && (
                      <p className="text-xs text-welted-text-muted mt-0.5">{entry.products_used}</p>
                    )}
                  </div>
                  <p className="text-xs text-welted-text-muted">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Patina Timeline */}
      {posts.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold text-welted-text mb-3">Patina Timeline</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`} className="shrink-0">
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-welted-border">
                  <Image src={imageSrc(post.image_url)} alt="Post" fill className="object-cover" />
                </div>
                <p className="text-[10px] text-welted-text-muted mt-1 text-center">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Pair"
        description={`Are you sure you want to delete your ${pair.brand} ${pair.model}? This action cannot be undone.`}
        actions={[
          { label: 'Cancel', onClick: () => {}, variant: 'cancel' },
          { label: 'Delete', onClick: handleDelete, variant: 'danger' },
        ]}
      />
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-welted-text-muted uppercase tracking-wider font-medium">{label}</p>
      <div className="text-sm font-semibold text-welted-text mt-0.5">{value}</div>
    </div>
  );
}
