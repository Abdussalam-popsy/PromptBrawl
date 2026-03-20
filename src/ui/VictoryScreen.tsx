import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { type FighterConfig } from '../ai/fighterConfig';

interface VictoryScreenProps {
  winner: FighterConfig;
  onPlayAgain: () => void;
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function VictoryScreen({ winner, onPlayAgain }: VictoryScreenProps) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const winnerLabelRef = useRef<HTMLParagraphElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const primary = winner.color_palette.primary;
  const secondary = winner.color_palette.secondary;
  const accent = winner.color_palette.accent;

  useEffect(() => {
    // Staggered entrance animations
    if (winnerLabelRef.current) {
      gsap.from(winnerLabelRef.current, {
        y: -40,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    }

    if (nameRef.current) {
      gsap.from(nameRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'back.out(1.7)',
      });
    }

    if (lineRef.current) {
      gsap.from(lineRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.5,
        delay: 0.5,
        ease: 'power2.out',
      });
    }

    if (btnRef.current) {
      gsap.from(btnRef.current, {
        scale: 0.5,
        opacity: 0,
        duration: 0.4,
        delay: 0.8,
        ease: 'back.out(1.4)',
      });
      // Pulse the button subtly
      gsap.to(btnRef.current, {
        scale: 1.04,
        duration: 0.8,
        delay: 1.3,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }

    // Confetti burst
    if (confettiRef.current) {
      const container = confettiRef.current;
      const colors = [primary, secondary, accent, '#ffffff', '#ffdd44', '#ff66aa'];

      for (let i = 0; i < 80; i++) {
        const piece = document.createElement('div');
        const size = 6 + Math.random() * 12;
        const isCircle = Math.random() > 0.6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        piece.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${isCircle ? size : size * 0.4}px;
          background: ${color};
          border-radius: ${isCircle ? '50%' : '2px'};
          left: ${30 + Math.random() * 40}%;
          top: 40%;
          pointer-events: none;
          opacity: 0;
        `;
        container.appendChild(piece);

        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 400;

        gsap.to(piece, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance + Math.random() * 300,
          rotation: Math.random() * 1080 - 540,
          opacity: 1,
          duration: 0.3,
          delay: 0.1 + Math.random() * 0.3,
          ease: 'power2.out',
        });

        gsap.to(piece, {
          opacity: 0,
          duration: 1,
          delay: 1.5 + Math.random() * 1.5,
          ease: 'power1.in',
          onComplete: () => piece.remove(),
        });
      }
    }
  }, [winner, primary, secondary, accent]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at center, ${primary}, ${darken(primary, 0.5)} 60%, ${darken(primary, 0.8)} 100%)`,
      zIndex: 20,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Confetti container */}
      <div
        ref={confettiRef}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      />

      {/* Background glow accents */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${secondary}44 0%, transparent 70%)`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* WINNER label */}
      <p
        ref={winnerLabelRef}
        style={{
          fontSize: '28px',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '12px',
          marginBottom: '4px',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          zIndex: 1,
        }}
      >
        WINNER
      </p>

      {/* Fighter name */}
      <h1
        ref={nameRef}
        style={{
          fontSize: 'clamp(48px, 10vw, 96px)',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '6px',
          margin: '0 0 20px 0',
          textAlign: 'center',
          textShadow: `
            2px 2px 0 rgba(0,0,0,0.4),
            4px 4px 0 rgba(0,0,0,0.2),
            0 0 60px rgba(0,0,0,0.3)
          `,
          lineHeight: 1.1,
          padding: '0 20px',
          zIndex: 1,
        }}
      >
        {winner.name}
      </h1>

      {/* Victory line */}
      <p
        ref={lineRef}
        style={{
          color: '#fff',
          fontSize: 'clamp(18px, 3vw, 28px)',
          fontStyle: 'italic',
          fontWeight: 600,
          maxWidth: '600px',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: '0 0 48px 0',
          padding: '16px 24px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '12px',
          textShadow: '0 2px 4px rgba(0,0,0,0.4)',
          zIndex: 1,
        }}
      >
        &ldquo;{winner.victory_line}&rdquo;
      </p>

      {/* Play Again button */}
      <button
        ref={btnRef}
        onClick={onPlayAgain}
        style={{
          padding: '20px 64px',
          fontSize: '24px',
          fontWeight: 900,
          background: '#fff',
          color: darken(primary, 0.3),
          border: 'none',
          borderRadius: '14px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          zIndex: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)';
        }}
      >
        Play Again
      </button>
    </div>
  );
}
