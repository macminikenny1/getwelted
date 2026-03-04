'use client';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Chip({ label, selected = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border shrink-0 ${
        selected
          ? 'bg-welted-accent/15 border-welted-accent text-welted-accent'
          : 'bg-welted-card border-welted-border text-welted-text-muted hover:text-welted-text hover:border-welted-text-muted'
      } ${className}`}
    >
      {label}
    </button>
  );
}
