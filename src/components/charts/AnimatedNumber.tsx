import { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  digits?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  digits = 0,
  prefix = '',
  suffix = '',
  duration = 0.65,
  className = '',
}: AnimatedNumberProps) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState<string>(() =>
    Number(value || 0).toLocaleString('id-ID', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const controls = animate(mv, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplay(
          latest.toLocaleString('id-ID', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          })
        );
      },
    });
    return () => controls.stop();
  }, [value, digits, duration, mv]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
