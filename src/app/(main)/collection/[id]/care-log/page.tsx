'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Droplets, Sparkles, Wrench, Shield, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Modal from '@/components/ui/Modal';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import type { CareLogEntry } from '@/types';

const EVENT_TYPES = [
  { id: 'conditioned', label: 'Conditioned', icon: Droplets },
  { id: 'polished', label: 'Polished', icon: Sparkles },
  { id: 'resoled', label: 'Resoled', icon: Wrench },
  { id: 'waterproofed', label: 'Waterproofed', icon: Shield },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

type EventType = (typeof EVENT_TYPES)[number]['id'];

export default function CareLogPage() {
  const params = useParams();
  const pairId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<CareLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [eventType, setEventType] = useState<EventType>('conditioned');
  const [productsUsed, setProductsUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('care_log')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEntries(data as CareLogEntry[]);
    }
    setLoading(false);
  }, [pairId]);

  useEffect(() => {
    if (!authLoading) fetchEntries();
  }, [authLoading, fetchEntries]);

  const handleAdd = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('care_log').insert({
        pair_id: pairId,
        user_id: user.id,
        event_type: eventType,
        products_used: productsUsed.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      showToast('Care entry added!');
      setAddOpen(false);
      setEventType('conditioned');
      setProductsUsed('');
      setNotes('');
      fetchEntries();
    } catch {
      showToast('Failed to add entry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { error } = await supabase.from('care_log').delete().eq('id', deleteTarget).eq('user_id', user?.id);

    if (error) {
      showToast('Failed to delete entry.', 'error');
    } else {
      showToast('Entry deleted.');
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
    }
    setDeleteTarget(null);
  };

  const getEventIcon = (type: string) => {
    const config = EVENT_TYPES.find((e) => e.id === type);
    if (!config) return MoreHorizontal;
    return config.icon;
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
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
          <Link href={`/collection/${pairId}`} className="text-welted-text-muted hover:text-welted-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-welted-text">Care Log</h1>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Droplets size={48} className="text-welted-text-muted/30 mb-4" />
          <h2 className="text-lg font-semibold text-welted-text mb-1">No care entries yet</h2>
          <p className="text-welted-text-muted text-sm mb-6">
            Track your conditioning, polishing, and maintenance.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} className="mr-1.5" />
            Add First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const Icon = getEventIcon(entry.event_type);
            return (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-welted-accent/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-welted-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-welted-text capitalize">
                        {entry.event_type}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-welted-text-muted">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => setDeleteTarget(entry.id)}
                          className="text-welted-text-muted hover:text-welted-danger transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {entry.products_used && (
                      <p className="text-xs text-welted-accent mt-1">{entry.products_used}</p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-welted-text-muted mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Care Entry"
        actions={
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="text-welted-accent text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        }
      >
        <div className="space-y-4">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <Chip
                  key={type.id}
                  label={type.label}
                  selected={eventType === type.id}
                  onClick={() => setEventType(type.id)}
                />
              ))}
            </div>
          </div>

          {/* Products Used */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Products Used</label>
            <input
              type="text"
              value={productsUsed}
              onChange={(e) => setProductsUsed(e.target.value)}
              placeholder="e.g. Bick 4, Venetian Shoe Cream"
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the leather respond? Any observations?"
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
        title="Delete Entry"
        description="Are you sure you want to delete this care log entry?"
        actions={[
          { label: 'Cancel', onClick: () => {}, variant: 'cancel' },
          { label: 'Delete', onClick: handleDelete, variant: 'danger' },
        ]}
      />
    </div>
  );
}
