import { useEffect, useState } from 'react';

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  enabled = true,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  enabled?: boolean;
}) {
  const [displayed, setDisplayed] = useState(enabled ? 0 : value);

  useEffect(() => {
    if (
      !enabled ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const frame = requestAnimationFrame(() => setDisplayed(value));
      return () => cancelAnimationFrame(frame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 900);
      setDisplayed(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [enabled, value]);

  return <>{prefix}{displayed.toLocaleString('id-ID')}{suffix}</>;
}
