import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface FightCountdownProps {
  onComplete: () => void;
  accentColor?: string;
}

const STEPS: { label: string; at: number }[] = [
  { label: '3', at: 0 },
  { label: '2', at: 800 },
  { label: '1', at: 1600 },
  { label: 'FIGHT!', at: 2400 },
];

const TOTAL_DURATION = 3000;

export function FightCountdown({ onComplete, accentColor = '#00d4ff' }: FightCountdownProps) {
  const [current, setCurrent] = useState('3');
  const [animKey, setAnimKey] = useState(0);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Schedule each step
    for (const step of STEPS) {
      const id = setTimeout(() => {
        setCurrent(step.label);
        setAnimKey(prev => prev + 1);
      }, step.at);
      timersRef.current.push(id);
    }

    // Complete and unmount
    const doneId = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, TOTAL_DURATION);
    timersRef.current.push(doneId);

    return () => {
      timersRef.current.forEach(id => clearTimeout(id));
      timersRef.current = [];
    };
  }, [onComplete]);

  const isFight = current === 'FIGHT!';

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div
        key={animKey}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: isFight ? '140px' : '120px',
          fontWeight: 900,
          color: isFight ? '#ffffff' : accentColor,
          textTransform: 'uppercase',
          letterSpacing: isFight ? '0.15em' : '0.05em',
          textShadow: isFight
            ? '0 0 60px rgba(255,255,255,0.5), 0 0 120px rgba(255,255,255,0.2)'
            : `0 0 40px ${accentColor}66, 0 0 80px ${accentColor}22`,
          animation: 'countdown-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          userSelect: 'none',
        }}
      >
        {current}
      </div>

      <style>{`
        @keyframes countdown-pop {
          0% {
            transform: scale(1.4);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          70% {
            transform: scale(1.0);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
