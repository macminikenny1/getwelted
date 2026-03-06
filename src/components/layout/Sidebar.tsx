'use client';

import Link from 'next/link';
import { Home, Search, Package, BookOpen, ShoppingBag, MessageSquare, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/collection', label: 'Collection', icon: Package },
  { href: '/brands', label: 'Brands', icon: BookOpen },
  { href: '/bst', label: 'BST', icon: ShoppingBag },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

interface SidebarProps {
  currentPath: string;
  unreadMessages?: number;
}

export default function Sidebar({ currentPath, unreadMessages = 0 }: SidebarProps) {
  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col bg-welted-bg border-r border-welted-border z-40 md:w-20 lg:w-64 transition-all">
      {/* Logo */}
      <div className="p-6 border-b border-welted-border">
        <Link href="/">
          <h1 className="text-welted-accent font-black tracking-[0.3em] text-lg lg:text-xl hidden lg:block">WELTED</h1>
          <span className="text-welted-accent font-black text-xl lg:hidden block text-center">W</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = href === '/messages' && unreadMessages > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 px-6 py-3 mx-2 rounded-lg transition-colors ${
                active
                  ? 'bg-welted-accent/10 text-welted-accent'
                  : 'text-welted-text-muted hover:text-welted-text hover:bg-welted-card'
              }`}
            >
              <div className="relative shrink-0">
                <Icon size={22} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 bg-welted-burgundy text-white text-[9px] font-bold min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-0.5">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-sm font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
