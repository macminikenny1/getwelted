interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const base = 'bg-welted-card border border-welted-border rounded-xl';
  const hoverClass = hover ? 'hover:bg-welted-card-hover cursor-pointer transition-colors' : '';
  const Component = onClick ? 'button' : 'div';

  return (
    <Component className={`${base} ${hoverClass} ${className}`} onClick={onClick}>
      {children}
    </Component>
  );
}
