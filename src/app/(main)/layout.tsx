'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUnreadMessages(0); return; }
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .in('type', ['message', 'trade_offer', 'trade_accepted']);
      setUnreadMessages(count ?? 0);
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-welted-bg">
      {/* Desktop sidebar */}
      <Sidebar currentPath={pathname} unreadMessages={unreadMessages} />

      {/* Main content area */}
      <div className="lg:ml-64 md:ml-20 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto w-full px-0 lg:px-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav currentPath={pathname} unreadMessages={unreadMessages} />
    </div>
  );
}
