interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'muted';
  className?: string;
}

const variants = {
  default: 'bg-welted-card border border-welted-border text-welted-text',
  accent: 'bg-welted-accent/15 text-welted-accent border border-welted-accent/30',
  success: 'bg-welted-success/15 text-welted-success border border-welted-success/30',
  danger: 'bg-welted-danger/15 text-welted-danger border border-welted-danger/30',
  muted: 'bg-welted-card text-welted-text-muted border border-welted-border',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
