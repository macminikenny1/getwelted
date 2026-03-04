'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLeatherProfile, getCareRoutine, CARE_GOALS } from '@/lib/careAdvisor';
import type { CareGoal, CareRoutine } from '@/lib/careAdvisor';
import type { LeatherProfile } from '@/lib/leatherDatabase';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { Pair } from '@/types';

const OIL_LEVELS: Record<string, { label: string; variant: 'success' | 'accent' | 'danger' }> = {
  low: { label: 'Low', variant: 'danger' },
  medium: { label: 'Medium', variant: 'accent' },
  high: { label: 'High', variant: 'success' },
};

export default function CareAdvisorPage() {
  const params = useParams();
  const pairId = params.id as string;
  const searchParams = useSearchParams();

  const { loading: authLoading } = useAuth();

  // Try to get from search params first
  const paramBrand = searchParams.get('brand');
  const paramModel = searchParams.get('model');
  const paramLeatherType = searchParams.get('leatherType');
  const paramIsRoughout = searchParams.get('isRoughout') === 'true';

  const [pair, setPair] = useState<Pair | null>(null);
  const [loading, setLoading] = useState(!paramBrand);
  const [selectedGoal, setSelectedGoal] = useState<CareGoal>('patina');

  // Resolve pair data: prefer search params, fallback to fetching
  const brand = paramBrand || pair?.brand || '';
  const model = paramModel || pair?.model || '';
  const leatherType = paramLeatherType || pair?.leather_type || '';
  const isRoughout = paramBrand ? paramIsRoughout : (pair?.is_roughout ?? false);

  useEffect(() => {
    if (paramBrand) {
      setLoading(false);
      return;
    }
    // Fetch pair data
    const supabase = createClient();
    supabase
      .from('pairs')
      .select('*')
      .eq('id', pairId)
      .single()
      .then(({ data }) => {
        if (data) setPair(data as Pair);
        setLoading(false);
      });
  }, [pairId, paramBrand]);

  const profile: LeatherProfile = useMemo(
    () => getLeatherProfile(leatherType, brand, model),
    [leatherType, brand, model]
  );

  const routine: CareRoutine = useMemo(
    () => getCareRoutine(leatherType, selectedGoal, brand, model, isRoughout),
    [leatherType, selectedGoal, brand, model, isRoughout]
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/collection/${pairId}`} className="text-welted-text-muted hover:text-welted-text transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-welted-text">Care Advisor</h1>
          {brand && (
            <p className="text-welted-text-muted text-sm">
              {brand} {model}
            </p>
          )}
        </div>
      </div>

      {/* Leather Profile Card */}
      <Card className="p-4 mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-welted-text-muted uppercase tracking-wider font-medium">Leather Profile</p>
            <h3 className="text-lg font-bold text-welted-text mt-0.5">{profile.displayName}</h3>
            {profile.tannery && (
              <p className="text-xs text-welted-text-muted mt-0.5">{profile.tannery}</p>
            )}
          </div>
          {isRoughout && <Badge variant="muted">Roughout</Badge>}
        </div>

        <p className="text-sm text-welted-text-muted mb-4">{profile.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <PropertyBadge label="Oil Content" level={profile.oilContent} />
          <PropertyBadge label="Water Resistance" level={profile.waterResistance} />
          <PropertyBadge label="Darkening Risk" level={profile.darkeningRisk} />
          <PropertyBadge label="Scratch Visibility" level={profile.scratchVisibility} />
        </div>

        {profile.selfHealing && (
          <div className="mt-3 pt-3 border-t border-welted-border">
            <Badge variant="success">Self-Healing Leather</Badge>
          </div>
        )}

        {/* Care Notes */}
        {profile.careNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-welted-border">
            <p className="text-xs font-semibold text-welted-text mb-2">Key Notes</p>
            <ul className="space-y-1.5">
              {profile.careNotes.map((note, i) => (
                <li key={i} className="text-xs text-welted-text-muted flex items-start gap-2">
                  <span className="text-welted-accent mt-0.5 shrink-0">--</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Goal Selection */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-welted-text mb-3">What is your goal?</p>
        <div className="grid grid-cols-1 gap-2">
          {CARE_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                selectedGoal === goal.id
                  ? 'bg-welted-accent/10 border-welted-accent'
                  : 'bg-welted-card border-welted-border hover:bg-welted-card-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{goal.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    selectedGoal === goal.id ? 'text-welted-accent' : 'text-welted-text'
                  }`}>
                    {goal.label}
                  </p>
                  <p className="text-xs text-welted-text-muted mt-0.5">{goal.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Care Routine */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-welted-accent" />
          <p className="text-sm font-semibold text-welted-text">Your Care Routine</p>
        </div>

        <Card className="p-4 mb-3">
          <p className="text-sm text-welted-text-muted">{routine.summary}</p>
        </Card>

        {/* Warning */}
        {routine.warning && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-welted-danger/10 border border-welted-danger/30 mb-3">
            <AlertTriangle size={18} className="text-welted-danger shrink-0 mt-0.5" />
            <p className="text-sm text-welted-danger">{routine.warning}</p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {routine.steps.map((step) => (
            <Card key={step.step} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-welted-accent/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-welted-accent">{step.step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-welted-text">{step.title}</p>
                  <p className="text-xs text-welted-text-muted mt-1">{step.detail}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="muted">{step.frequency}</Badge>
                    {step.products.map((product, i) => (
                      <Badge key={i} variant="accent">{product}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-welted-accent/10 border border-welted-accent/30 mt-3">
          <Lightbulb size={18} className="text-welted-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-welted-accent mb-0.5">Pro Tip</p>
            <p className="text-sm text-welted-text">{routine.proTip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyBadge({ label, level }: { label: string; level: 'low' | 'medium' | 'high' }) {
  const config = OIL_LEVELS[level];
  return (
    <div className="flex items-center justify-between bg-welted-input-bg rounded-lg px-3 py-2">
      <p className="text-xs text-welted-text-muted">{label}</p>
      <Badge variant={config.variant}>{config.label}</Badge>
    </div>
  );
}
