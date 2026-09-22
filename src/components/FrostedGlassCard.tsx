import React from 'react';

interface FrostedGlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'orange' | 'deep';
  glowHover?: boolean;
}

export const FrostedGlassCard: React.FC<FrostedGlassCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  glowHover = false,
}) => {
  let baseClass = 'glass-card';
  if (variant === 'orange') baseClass = 'glass-card-orange';
  if (variant === 'deep') baseClass = 'glass-card-deep';

  const hoverClass = onClick || glowHover
    ? 'transition-all duration-200 hover:scale-[1.01] hover:border-white/20 active:scale-[0.99] cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl relative overflow-hidden ${baseClass} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};
