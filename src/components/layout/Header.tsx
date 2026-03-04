'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadCount(count ?? 0);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-welted-bg/80 backdrop-blur-md border-b border-welted-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6 py-3">
        <h2 className="text-welted-accent font-black tracking-[0.3em] text-lg md:hidden">WELTED</h2>
        <div className="hidden md:block" />
        <Link href="/notifications" className="relative p-2 -m-2">
          <Bell size={22} className="text-welted-text-muted hover:text-welted-text transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-welted-burgundy text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
