'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Wrench, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Dialog from '@/components/ui/Dialog';
import Spinner from '@/components/ui/Spinner';
import type { ResoleLogEntry } from '@/types';

export default function ResoleLogPage() {
  const params = useParams();
  const pairId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<ResoleLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [resoleDate, setResoleDate] = useState('');
  const [cobbler, setCobbler] = useState('');
  const [soleType, setSoleType] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('resole_log')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEntries(data as ResoleLogEntry[]);
    }
    setLoading(false);
  }, [pairId]);

  useEffect(() => {
    if (!authLoading) fetchEntries();
  }, [authLoading, fetchEntries]);

  const resetForm = () => {
    setResoleDate('');
    setCobbler('');
    setSoleType('');
    setCost('');
    setNotes('');
  };

  const handleAdd = async () => {
    if (!user) return;
    if (!cobbler.trim()) {
      showToast('Cobbler name is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('resole_log').insert({
        pair_id: pairId,
        user_id: user.id,
        resole_date: resoleDate || new Date().toISOString().split('T')[0],
        cobbler: cobbler.trim(),
        sole_type: soleType.trim() || null,
        cost: cost ? parseFloat(cost) : null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      showToast('Resole entry added!');
      setAddOpen(false);
      resetForm();
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
    const { error } = await supabase.from('resole_log').delete().eq('id', deleteTarget).eq('user_id', user?.id);

    if (error) {
      showToast('Failed to delete entry.', 'error');
    } else {
      showToast('Entry deleted.');
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
    }
    setDeleteTarget(null);
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

  // Calculate total cost
  const totalCost = entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href={`/collection/${pairId}`} className="text-welted-text-muted hover:text-welted-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-welted-text">Resole Log</h1>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-welted-accent">{entries.length}</p>
            <p className="text-xs text-welted-text-muted mt-0.5">
              {entries.length === 1 ? 'Resole' : 'Resoles'}
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-welted-accent">
              ${totalCost.toFixed(0)}
            </p>
            <p className="text-xs text-welted-text-muted mt-0.5">Total Cost</p>
          </Card>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wrench size={48} className="text-welted-text-muted/30 mb-4" />
          <h2 className="text-lg font-semibold text-welted-text mb-1">No resoles yet</h2>
          <p className="text-welted-text-muted text-sm mb-6">
            Track your resole history, cobblers, and costs.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} className="mr-1.5" />
            Add First Resole
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-welted-accent/10 flex items-center justify-center shrink-0">
                    <Wrench size={18} className="text-welted-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-welted-text">{entry.cobbler}</p>
                    <p className="text-xs text-welted-text-muted mt-0.5">
                      {new Date(entry.resole_date).toLocaleDateString()}
                    </p>
                    {entry.sole_type && (
                      <p className="text-xs text-welted-accent mt-1">{entry.sole_type}</p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-welted-text-muted mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {entry.cost != null && (
                    <div className="flex items-center gap-1 text-welted-text">
                      <DollarSign size={14} />
                      <span className="text-sm font-semibold">{entry.cost}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setDeleteTarget(entry.id)}
                    className="text-welted-text-muted hover:text-welted-danger transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); resetForm(); }}
        title="Add Resole Entry"
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
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Date</label>
            <input
              type="date"
              value={resoleDate}
              onChange={(e) => setResoleDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Cobbler */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Cobbler *</label>
            <input
              type="text"
              value={cobbler}
              onChange={(e) => setCobbler(e.target.value)}
              placeholder="e.g. Brian the Bootmaker"
              className={inputClass}
            />
          </div>

          {/* Sole Type */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Sole Type</label>
            <input
              type="text"
              value={soleType}
              onChange={(e) => setSoleType(e.target.value)}
              placeholder="e.g. Vibram 430, Dainite"
              className={inputClass}
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Cost ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="150"
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-welted-text mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details about this resole..."
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
        description="Are you sure you want to delete this resole log entry?"
        actions={[
          { label: 'Cancel', onClick: () => {}, variant: 'cancel' },
          { label: 'Delete', onClick: handleDelete, variant: 'danger' },
        ]}
      />
    </div>
  );
}
