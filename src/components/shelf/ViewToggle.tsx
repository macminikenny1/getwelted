'use client';

import { LayoutGrid, BookOpen } from 'lucide-react';

type ViewMode = 'grid' | 'shelf';

interface ViewToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div className="view-toggle">
      <button
        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onToggle('grid')}
        aria-label="Grid view"
      >
        <LayoutGrid size={15} />
      </button>
      <button
        className={`view-toggle-btn ${viewMode === 'shelf' ? 'active' : ''}`}
        onClick={() => onToggle('shelf')}
        aria-label="Shelf view"
      >
        <BookOpen size={15} />
      </button>
    </div>
  );
}
