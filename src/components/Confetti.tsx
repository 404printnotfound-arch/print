import React, { useEffect, useState } from 'react';

export default function Confetti() {
  const [pieces, setPieces] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const colors = ['#facc15', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'];
    const newPieces = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage x width
      y: -10 - Math.random() * 20, // start above screen
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6, // 6px to 14px
      delay: Math.random() * 2, // staggered build up
      duration: Math.random() * 2.5 + 2, // speed
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: 0.85,
            transform: 'rotate(0deg)',
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
