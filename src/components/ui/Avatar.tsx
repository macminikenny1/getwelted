import Image from 'next/image';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-20 h-20 text-xl',
};

export default function Avatar({ url, name, size = 'md', className = '' }: AvatarProps) {
  const initial = (name || '?')[0].toUpperCase();
  const sizeClass = sizes[size];
  const pxMap = { sm: 28, md: 36, lg: 48, xl: 80 };

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={pxMap[size]}
        height={pxMap[size]}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-welted-burgundy flex items-center justify-center font-bold text-welted-text shrink-0 ${className}`}>
      {initial}
    </div>
  );
}
