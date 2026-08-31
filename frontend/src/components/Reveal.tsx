import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

interface RevealProps {
  children: ReactNode;
  /** Delay in ms before animating once visible. */
  delay?: number;
  /** Direction of entry. */
  direction?: 'up' | 'left' | 'right' | 'none';
  /** Extra class names applied to the wrapper element. */
  className?: string;
}

/**
 * Scroll-reveal wrapper. Uses an IntersectionObserver to add `reveal-visible`
 * once the element enters the viewport, triggering the CSS transition in
 * index.css. Respects reduced-motion via CSS.
 */
export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const directionClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
        ? 'reveal-right'
        : '';

  const style: CSSProperties = { ['--d' as string]: `${delay}ms` };

  return (
    <div ref={ref} className={`reveal ${directionClass} ${className}`} style={style}>
      {children}
    </div>
  );
}
