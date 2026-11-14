import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PIECES = 56;

const TONES = [
  "bg-foreground",
  "bg-muted-foreground",
  "bg-(image:--avatar-1)",
  "bg-(image:--avatar-2)",
  "bg-(image:--avatar-3)",
  "bg-(image:--avatar-4)",
  "bg-(image:--avatar-6)",
] as const;

interface Piece {
  id: number;
  x: number;
  rise: number;
  fall: number;
  spin: number;
  size: number;
  delay: number;
  tone: (typeof TONES)[number];
}

const createPieces = (): Piece[] =>
  Array.from({ length: PIECES }, (_, id) => ({
    id,
    x: (Math.random() - 0.5) * 520,
    rise: -(120 + Math.random() * 180),
    fall: 160 + Math.random() * 220,
    spin: (Math.random() - 0.5) * 720,
    size: Math.random() > 0.7 ? 8 : 5,
    delay: Math.random() * 0.12,
    tone: TONES[id % TONES.length] ?? "bg-foreground",
  }));

interface PixelConfettiProps {
  onDone?: () => void;
}

export function PixelConfetti({ onDone }: PixelConfettiProps) {
  const [pieces] = useState(createPieces);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[38%] z-[70] flex justify-center">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, piece.x * 0.6, piece.x],
            y: [0, piece.rise, piece.fall],
            rotate: piece.spin,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.6, delay: piece.delay, ease: [0.22, 1, 0.36, 1], times: [0, 0.35, 1] }}
          onAnimationComplete={piece.id === 0 ? onDone : undefined}
          style={{ width: piece.size, height: piece.size }}
          className={cn("absolute top-0", piece.tone)}
        />
      ))}
    </div>
  );
}
