'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Package } from 'lucide-react';
import { imageSrc } from '@/lib/imageSrc';
import Badge from '@/components/ui/Badge';
import type { Pair } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'accent' | 'success' | 'muted' | 'danger' }> = {
  active: { label: 'Active', variant: 'success' },
  on_order: { label: 'On Order', variant: 'accent' },
  stored: { label: 'Stored', variant: 'muted' },
  sold: { label: 'Sold', variant: 'danger' },
};

interface BootShelfViewProps {
  pairs: Pair[];
}

function calcBootsPerRow(): number {
  if (typeof window === 'undefined') return 2;
  const w = window.innerWidth;
  if (w >= 1280) return 4;
  if (w >= 1024) return 3;
  if (w >= 640) return 3;
  return 2;
}

export default function BootShelfView({ pairs }: BootShelfViewProps) {
  const [bootsPerRow, setBootsPerRow] = useState(calcBootsPerRow);

  useEffect(() => {
    const onResize = () => setBootsPerRow(calcBootsPerRow());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const rows = useMemo(() => {
    const result: (Pair | null)[][] = [];
    for (let i = 0; i < pairs.length; i += bootsPerRow) {
      result.push(pairs.slice(i, i + bootsPerRow));
    }

    // Add empty CTA spot
    if (result.length === 0) {
      result.push([null]);
    } else {
      const lastRow = result[result.length - 1];
      if (lastRow.length < bootsPerRow) {
        lastRow.push(null);
      } else {
        result.push([null]);
      }
    }

    return result;
  }, [pairs, bootsPerRow]);

  let globalIndex = 0;

  return (
    <div className="shelf-frame">
      {/* Crown molding */}
      <div className="shelf-crown" />

      {/* Main body */}
      <div className="shelf-body">
        {/* Left side panel */}
        <div className="shelf-side-panel" />

        {/* Shelf content */}
        <div className="shelf-content">
          {rows.map((rowPairs, rowIndex) => (
            <div key={rowIndex}>
              {/* Overhead glow */}
              <div className="shelf-row-glow" />

              {/* Boots */}
              <div className="shelf-row-boots">
                {rowPairs.map((pair, i) => {
                  if (pair) {
                    const idx = globalIndex++;
                    const status = STATUS_CONFIG[pair.status] || STATUS_CONFIG.active;
                    const imageUrl = pair.image_urls?.[0];
                    const isStored = pair.status === 'stored';
                    const isSold = pair.status === 'sold';
                    const isOnOrder = pair.status === 'on_order';

                    return (
                      <Link
                        key={pair.id}
                        href={`/collection/${pair.id}`}
                        className="shelf-boot-item shelf-boot-animate"
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        <div className="shelf-boot-image">
                          {imageUrl ? (
                            <Image
                              src={imageSrc(imageUrl)}
                              alt={`${pair.brand} ${pair.model}`}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          ) : isOnOrder ? (
                            <div className="flex items-center justify-center h-full bg-welted-input-bg">
                              <div className="text-center">
                                <span className="text-2xl">📦</span>
                                <p className="text-[10px] text-welted-text-muted font-bold uppercase tracking-wider mt-1">On Order</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full bg-welted-input-bg">
                              <Package size={32} className="text-welted-text-muted/30" />
                            </div>
                          )}

                          {/* Status overlays */}
                          {isStored && <div className="shelf-overlay-stored" />}
                          {isSold && (
                            <div className="shelf-overlay-sold">
                              <span className="shelf-sold-stamp">SOLD</span>
                            </div>
                          )}

                          {/* Status badge */}
                          {pair.status !== 'active' && (
                            <div className="absolute top-1.5 right-1.5">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Contact shadow */}
                        <div className="shelf-boot-shadow" />

                        {/* Nameplate */}
                        <div className="shelf-boot-label">
                          <p className="shelf-boot-brand">{pair.brand}</p>
                          <p className="shelf-boot-model">{pair.model}</p>
                        </div>
                      </Link>
                    );
                  }

                  // Empty spot
                  return (
                    <Link
                      key={`empty-${i}`}
                      href="/collection/new"
                      className="shelf-boot-item"
                    >
                      <div className="shelf-empty-spot">
                        <div>
                          <Plus size={24} className="text-welted-text-muted mb-1" />
                          <span className="text-[10px] text-welted-text-muted font-semibold uppercase tracking-wider">
                            Add Pair
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Shelf plank */}
              <div className="shelf-plank" />

              {/* Shelf lip */}
              <div className="shelf-lip" />

              {/* Cast shadow below */}
              <div className="shelf-cast-shadow" />
            </div>
          ))}
        </div>

        {/* Right side panel */}
        <div className="shelf-side-panel" />
      </div>

      {/* Base molding */}
      <div className="shelf-base" />
    </div>
  );
}
