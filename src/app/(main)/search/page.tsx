'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { Search, Users, ImageIcon, Tag, X } from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';

interface PostResult {
  id: string;
  image_url: string;
  caption: string | null;
  brand: string | null;
  model: string | null;
}

interface ListingResult {
  id: string;
  brand: string;
  model: string;
  asking_price: number | null;
  image_urls: string[];
  status: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [listings, setListings] = useState<ListingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setUsers([]);
      setPosts([]);
      setListings([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    const supabase = createClient();
    // Escape special ilike characters to prevent query manipulation
    const escaped = term.trim().replace(/[%_\\]/g, '\\$&');
    const pattern = `%${escaped}%`;

    const [usersRes, postsRes, listingsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('posts')
        .select('id, image_url, caption, brand, model')
        .or(`caption.ilike.${pattern},brand.ilike.${pattern},model.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('bst_listings')
        .select('id, brand, model, asking_price, image_urls, status')
        .eq('status', 'active')
        .or(`brand.ilike.${pattern},model.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    setUsers(usersRes.data ?? []);
    setPosts((postsRes.data ?? []) as PostResult[]);
    setListings((listingsRes.data ?? []) as ListingResult[]);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  const clearSearch = () => {
    setQuery('');
    setUsers([]);
    setPosts([]);
    setListings([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const totalResults = users.length + posts.length + listings.length;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-welted-text">Search</h1>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-welted-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, posts, listings..."
          className="w-full rounded-lg border border-welted-border bg-welted-input-bg pl-10 pr-10 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
          autoFocus
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-welted-text-muted hover:text-welted-text transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Loading */}
      {searching && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {/* Empty State */}
      {!searching && !hasSearched && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-welted-text-muted/30 mb-4" />
          <p className="text-welted-text-muted text-sm">
            Search across users, posts, and BST listings.
          </p>
        </div>
      )}

      {/* No Results */}
      {!searching && hasSearched && totalResults === 0 && (
        <div className="text-center py-16">
          <p className="text-welted-text-muted text-sm">
            No results found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Results */}
      {!searching && hasSearched && totalResults > 0 && (
        <div className="space-y-6">
          {/* Users */}
          {users.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-welted-text-muted" />
                <h2 className="text-sm font-semibold text-welted-text-muted uppercase tracking-wide">Users</h2>
              </div>
              <div className="space-y-1">
                {users.map(u => (
                  <Link
                    key={u.id}
                    href={`/user/${u.username}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-welted-card transition-colors"
                  >
                    <Avatar url={u.avatar_url} name={u.display_name || u.username} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-welted-text truncate">
                        {u.display_name || u.username}
                      </p>
                      <p className="text-xs text-welted-text-muted">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-welted-text-muted" />
                <h2 className="text-sm font-semibold text-welted-text-muted uppercase tracking-wide">Posts</h2>
              </div>
              <div className="space-y-1">
                {posts.map(p => (
                  <Link
                    key={p.id}
                    href={`/post/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-welted-card transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={imageSrc(p.image_url)} alt="Post" fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-welted-text truncate">
                        {p.caption || `${p.brand || ''} ${p.model || ''}`.trim() || 'Untitled post'}
                      </p>
                      {p.brand && (
                        <p className="text-xs text-welted-text-muted">{p.brand} {p.model}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Listings */}
          {listings.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-welted-text-muted" />
                <h2 className="text-sm font-semibold text-welted-text-muted uppercase tracking-wide">Listings</h2>
              </div>
              <div className="space-y-1">
                {listings.map(l => (
                  <Link
                    key={l.id}
                    href={`/bst/${l.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-welted-card transition-colors"
                  >
                    {l.image_urls?.[0] ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <Image src={imageSrc(l.image_urls[0])} alt="Listing" fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-welted-card border border-welted-border flex items-center justify-center shrink-0">
                        <Tag size={16} className="text-welted-text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-welted-text truncate">
                        {l.brand} {l.model}
                      </p>
                      {l.asking_price != null && (
                        <p className="text-xs text-welted-accent font-semibold">${l.asking_price}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
