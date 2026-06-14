import type { ReactNode } from 'react';

export function StaggerContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return <div className={className}>{children}</div>;
}
