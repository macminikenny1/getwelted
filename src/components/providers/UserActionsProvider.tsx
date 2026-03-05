'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface WantItem {
  brand: string;
  model: string;
  leatherType: string | null;
}

interface UserActionsContextType {
  savedPostIds: Set<string>;
  wantedModels: Map<string, WantItem>;
  toggleSave: (postId: string) => void;
  toggleWant: (brand: string, model: string, leatherType: string | null) => void;
  isSaved: (postId: string) => boolean;
  isWanted: (brand: string, model: string) => boolean;
}

const UserActionsContext = createContext<UserActionsContextType | null>(null);

export function UserActionsProvider({ children }: { children: React.ReactNode }) {
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [wantedModels, setWantedModels] = useState<Map<string, WantItem>>(new Map());

  useEffect(() => {
    const supabase = createClient();

    const load = async (userId: string) => {
      const [savedRes, wantRes] = await Promise.all([
        supabase.from('saved_posts').select('post_id').eq('user_id', userId),
        supabase.from('wish_list').select('brand, model, leather_type').eq('user_id', userId),
      ]);
      if (savedRes.data) {
        setSavedPostIds(new Set(savedRes.data.map((r: any) => r.post_id)));
      }
      if (wantRes.data) {
        const map = new Map<string, WantItem>();
        wantRes.data.forEach((r: any) => {
          if (r.brand && r.model) map.set(`${r.brand}|${r.model}`, { brand: r.brand, model: r.model, leatherType: r.leather_type });
        });
        setWantedModels(map);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) load(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        load(session.user.id);
      } else {
        setSavedPostIds(new Set());
        setWantedModels(new Map());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  }, []);

  const toggleWant = useCallback((brand: string, model: string, leatherType: string | null) => {
    const key = `${brand}|${model}`;
    setWantedModels(prev => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key); else next.set(key, { brand, model, leatherType });
      return next;
    });
  }, []);

  const isSaved = useCallback((postId: string) => savedPostIds.has(postId), [savedPostIds]);
  const isWanted = useCallback((brand: string, model: string) => wantedModels.has(`${brand}|${model}`), [wantedModels]);

  return (
    <UserActionsContext.Provider value={{ savedPostIds, wantedModels, toggleSave, toggleWant, isSaved, isWanted }}>
      {children}
    </UserActionsContext.Provider>
  );
}

export function useUserActions() {
  const ctx = useContext(UserActionsContext);
  if (!ctx) throw new Error('useUserActions must be used within UserActionsProvider');
  return ctx;
}
