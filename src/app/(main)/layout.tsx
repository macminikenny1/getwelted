'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-welted-bg">
      {/* Desktop sidebar */}
      <Sidebar currentPath={pathname} />
      
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
      <MobileNav currentPath={pathname} />
    </div>
  );
}
