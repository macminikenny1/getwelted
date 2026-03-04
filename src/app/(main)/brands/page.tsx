'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, MapPin, Calendar, DollarSign } from 'lucide-react';
import { BRAND_DATABASE, BRAND_CATEGORIES, type BrandProfile } from '@/lib/brandDatabase';
import Chip from '@/components/ui/Chip';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

const FLAG_MAP: Record<string, string> = {
  'USA': '\u{1F1FA}\u{1F1F8}',
  'Canada': '\u{1F1E8}\u{1F1E6}',
  'Japan': '\u{1F1EF}\u{1F1F5}',
  'England': '\u{1F1EC}\u{1F1E7}',
  'Spain': '\u{1F1EA}\u{1F1F8}',
  'China/USA Design': '\u{1F1E8}\u{1F1F3}\u{1F1FA}\u{1F1F8}',
};

const CATEGORY_VARIANTS: Record<string, 'accent' | 'success' | 'danger' | 'muted'> = {
  heritage: 'accent',
  workwear: 'success',
  dress: 'muted',
  lifestyle: 'danger',
};

export default function BrandsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredBrands = useMemo(() => {
    return BRAND_DATABASE.filter(brand => {
      const matchesCategory = selectedCategory === 'all' || brand.category === selectedCategory;
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-welted-text">Brand Database</h1>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {BRAND_CATEGORIES.map(cat => (
          <Chip
            key={cat.id}
            label={cat.label}
            selected={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-welted-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search brands..."
          className="w-full rounded-lg border border-welted-border bg-welted-input-bg pl-10 pr-4 py-2.5 text-sm text-welted-text placeholder:text-welted-text-muted/50 focus:outline-none focus:ring-1 focus:ring-welted-accent"
        />
      </div>

      {/* Brand List */}
      {filteredBrands.length === 0 ? (
        <div className="text-center py-12 text-welted-text-muted text-sm">
          No brands match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBrands.map(brand => {
            const isExpanded = expandedId === brand.id;
            return (
              <Card key={brand.id} className="overflow-hidden">
                {/* Collapsed Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(brand.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{FLAG_MAP[brand.country] || ''}</span>
                        <h3 className="text-base font-bold text-welted-text">{brand.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-welted-text-muted flex items-center gap-1">
                          <Calendar size={12} /> Est. {brand.founded}
                        </span>
                        <span className="text-xs text-welted-text-muted flex items-center gap-1">
                          <DollarSign size={12} /> {brand.priceRange}
                        </span>
                        <Badge variant={CATEGORY_VARIANTS[brand.category] || 'muted'}>
                          {brand.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-welted-text-muted line-clamp-2">{brand.knownFor}</p>
                    </div>
                    <div className="text-welted-text-muted shrink-0 mt-1">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-4 border-t border-welted-border mt-0 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-welted-text-muted">
                      <MapPin size={12} />
                      {brand.location}
                    </div>

                    <p className="text-sm text-welted-text leading-relaxed">{brand.description}</p>

                    {/* Construction Methods */}
                    <div>
                      <h4 className="text-xs font-semibold text-welted-text-muted uppercase tracking-wide mb-2">Construction</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {brand.construction.map(c => (
                          <span key={c} className="px-2.5 py-1 rounded-full bg-welted-accent/10 text-welted-accent text-xs font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Popular Models */}
                    <div>
                      <h4 className="text-xs font-semibold text-welted-text-muted uppercase tracking-wide mb-2">Popular Models</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {brand.popularModels.map(m => (
                          <span key={m} className="px-2.5 py-1 rounded-full bg-welted-card border border-welted-border text-welted-text text-xs font-medium">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Leathers */}
                    <div>
                      <h4 className="text-xs font-semibold text-welted-text-muted uppercase tracking-wide mb-2">Leathers</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {brand.leathers.map(l => (
                          <span key={l} className="px-2.5 py-1 rounded-full bg-welted-burgundy/20 text-welted-text text-xs font-medium">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
