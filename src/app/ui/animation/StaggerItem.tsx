import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function StaggerItem({
  children,
  className = '',
  index = 0,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  staggerDelay?: number;
}) {
  return (
    <Reveal className={className} delay={index * staggerDelay}>
      {children}
    </Reveal>
  );
}
