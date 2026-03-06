'use client';

import Link from 'next/link';
import { Home, Search, Package, BookOpen, ShoppingBag, MessageSquare, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/collection', label: 'Collect', icon: Package },
  { href: '/brands', label: 'Brands', icon: BookOpen },
  { href: '/bst', label: 'BST', icon: ShoppingBag },
  { href: '/messages', label: 'Inbox', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

interface MobileNavProps {
  currentPath: string;
  unreadMessages?: number;
}

export default function MobileNav({ currentPath, unreadMessages = 0 }: MobileNavProps) {
  const isActive = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-welted-bg border-t border-welted-border z-50 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = href === '/messages' && unreadMessages > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                active ? 'text-welted-accent' : 'text-welted-text-muted'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 bg-welted-burgundy text-white text-[9px] font-bold min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-0.5">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
