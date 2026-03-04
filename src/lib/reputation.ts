import { createClient } from '@/lib/supabase/client';

export interface ReputationData {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  score: number; // percentage of positive out of total
}

export async function fetchReputation(userId: string): Promise<ReputationData> {
  const supabase = createClient();
  const { data } = await supabase
    .from('feedback')
    .select('rating')
    .eq('to_user_id', userId);

  const items = data ?? [];
  const positive = items.filter((f: any) => f.rating === 'positive').length;
  const neutral = items.filter((f: any) => f.rating === 'neutral').length;
  const negative = items.filter((f: any) => f.rating === 'negative').length;
  const total = items.length;
  const score = total > 0 ? Math.round((positive / total) * 100) : 100;

  return { total, positive, neutral, negative, score };
}

export async function fetchReputationBatch(userIds: string[]): Promise<Record<string, { total: number; score: number }>> {
  if (userIds.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase
    .from('feedback')
    .select('to_user_id, rating')
    .in('to_user_id', userIds);

  const items = data ?? [];
  const result: Record<string, { total: number; score: number }> = {};
  for (const uid of userIds) {
    const mine = items.filter((f: any) => f.to_user_id === uid);
    const positive = mine.filter((f: any) => f.rating === 'positive').length;
    const total = mine.length;
    result[uid] = { total, score: total > 0 ? Math.round((positive / total) * 100) : 100 };
  }
  return result;
}
