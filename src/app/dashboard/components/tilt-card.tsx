"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  intensity?: number;
  glare?: boolean;
}

export function TiltCard({ children, className = "", onClick, intensity = 15, glare = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setTransform({
      rotateX: (0.5 - y) * intensity,
      rotateY: (x - 0.5) * intensity,
    });
    setGlarePos({ x: x * 100, y: y * 100 });
  }

  function handleMouseLeave() {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0 });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        rotateX: transform.rotateX,
        rotateY: transform.rotateY,
        scale: isHovering ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.5 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={`relative cursor-pointer ${className}`}
    >
      {children}
      {/* Glare overlay */}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: isHovering ? 0.15 : 0,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
