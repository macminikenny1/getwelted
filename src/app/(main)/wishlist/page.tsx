'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit3, Heart, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Modal from '@/components/ui/Modal';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import type { WishItem } from '@/types';

const QUICK_BRANDS = [
  'Red Wing', "Nicks", "White's", 'Viberg', 'Alden', 'Wesco',
  'Grant Stone', 'Truman', 'John Lofgren', 'Role Club',
];

export default function WishListPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [leatherType, setLeatherType] = useState('');
  const [colorway, setColorway] = useState('');
  const [sizeUs, setSizeUs] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wish_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data as WishItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchItems]);

  const resetForm = () => {
    setBrand('');
    setModel('');
    setLeatherType('');
    setColorway('');
    setSizeUs('');
    setNotes('');
    setUrl('');
    setEditingItem(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: WishItem) => {
    setEditingItem(item);
    setBrand(item.brand || '');
    setModel(item.model || '');
    setLeatherType(item.leather_type || '');
    setColorway(item.colorway || '');
    setSizeUs(item.size_us?.toString() || '');
    setNotes(item.notes || '');
    setUrl(item.url || '');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!brand.trim()) {
      showToast('Brand is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const payload = {
        user_id: user.id,
        brand: brand.trim() || null,
        model: model.trim() || null,
        leather_type: leatherType.trim() || null,
        colorway: colorway.trim() || null,
        size_us: sizeUs ? parseFloat(sizeUs) : null,
        notes: notes.trim() || null,
        url: url.trim() || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('wish_items')
          .update(payload)
          .eq('id', editingItem.id)
          .eq('user_id', user.id);
        if (error) throw error;
        showToast('Wish item updated!');
      } else {
        const { error } = await supabase
          .from('wish_items')
          .insert(payload);
        if (error) throw error;
        showToast('Added to wish list!');
      }

      setModalOpen(false);
      resetForm();
      fetchItems();
    } catch {
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { error } = await supabase.from('wish_items').delete().eq('id', deleteTarget).eq('user_id', user?.id);

    if (error) {
      showToast('Failed to delete item.', 'error');
    } else {
      showToast('Item removed.');
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
    }
    setDeleteTarget(null);
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
        <p className="text-welted-text-muted">Sign in to view your wish list.</p>
      </div>
    );
  }

  const inputClass =
    'w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:border-welted-accent transition-colors';

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/collection" className="text-welted-text-muted hover:text-welted-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-welted-text">Wish List</h1>
            <p className="text-welted-text-muted text-sm">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart size={48} className="text-welted-text-muted/30 mb-4" />
          <h2 className="text-lg font-semibold text-welted-text mb-1">Wish list is empty</h2>
          <p className="text-welted-text-muted text-sm mb-6">
            Keep track of boots you are dreaming about.
          </p>
          <Button onClick={openAdd}>
            <Plus size={16} className="mr-1.5" />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {item.brand && (
                    <p className="text-welted-text-muted text-[10px] font-semibold uppercase tracking-wider">
                      {item.brand}
                    </p>
                  )}
                  {item.model && (
                    <p className="text-sm font-bold text-welted-text mt-0.5">{item.model}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {item.leather_type && (
                      <p className="text-xs text-welted-text-muted">{item.leather_type}</p>
                    )}
                    {item.colorway && (
                      <p className="text-xs text-welted-text-muted">{item.colorway}</p>
                    )}
                    {item.size_us && (
                      <p className="text-xs text-welted-text-muted">US {item.size_us}</p>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-welted-text-muted mt-2 line-clamp-2">{item.notes}</p>
                  )}
                  {item.url && (item.url.startsWith('https://') || item.url.startsWith('http://')) && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-welted-accent mt-2 hover:underline"
                    >
                      <ExternalLink size={12} />
                      View Link
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="text-welted-text-muted hover:text-welted-text transition-colors p-1.5"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item.id)}
                    className="text-welted-text-muted hover:text-welted-danger transition-colors p-1.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingItem ? 'Edit Wish Item' : 'Add Wish Item'}
        actions={
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-welted-accent text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        }
      >
        <div className="space-y-4">
          {/* Quick Brand Chips */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Brand *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_BRANDS.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  selected={brand === b}
                  onClick={() => setBrand(brand === b ? '' : b)}
                />
              ))}
            </div>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Or type a brand..."
              className={inputClass}
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Service Boot"
              className={inputClass}
            />
          </div>

          {/* Leather */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Leather Type</label>
            <input
              type="text"
              value={leatherType}
              onChange={(e) => setLeatherType(e.target.value)}
              placeholder="e.g. Chromexcel"
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
              placeholder="e.g. Natural"
              className={inputClass}
            />
          </div>

          {/* Size */}
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

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Link (URL)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why do you want these?"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Item"
        description="Are you sure you want to remove this item from your wish list?"
        actions={[
          { label: 'Cancel', onClick: () => {}, variant: 'cancel' },
          { label: 'Remove', onClick: handleDelete, variant: 'danger' },
        ]}
      />
    </div>
  );
}
