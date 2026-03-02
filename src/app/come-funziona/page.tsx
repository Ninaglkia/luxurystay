"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/* ═══════════════ Intersection Observer Hook ═══════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ═══════════════ 3D Tilt Card ═══════════════ */

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (card) card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

/* ═══════════════ Floating 3D Shape ═══════════════ */

function FloatingShape({ delay = 0, size = 80, color = "bg-amber-400/20", top, left, right, bottom }: {
  delay?: number; size?: number; color?: string;
  top?: string; left?: string; right?: string; bottom?: string;
}) {
  return (
    <div
      className={`absolute ${color} rounded-2xl blur-sm`}
      style={{
        width: size, height: size, top, left, right, bottom,
        animation: `float3d ${6 + delay}s ease-in-out ${delay}s infinite`,
        transformStyle: "preserve-3d",
      }}
    />
  );
}

/* ═══════════════ Counter Animation ═══════════════ */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.3);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString("it-IT")}{suffix}</span>;
}

/* ═══════════════ 3D Villa ═══════════════ */

function Villa3D() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: -25, y: -35 });
  const autoRotateRef = useRef(true);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let angle = -35;
    function autoRotate() {
      if (!autoRotateRef.current || !sceneRef.current) {
        rafRef.current = requestAnimationFrame(autoRotate);
        return;
      }
      angle += 0.15;
      rotationRef.current.y = angle;
      sceneRef.current.style.transform =
        `rotateX(${rotationRef.current.x}deg) rotateY(${angle}deg)`;
      rafRef.current = requestAnimationFrame(autoRotate);
    }
    rafRef.current = requestAnimationFrame(autoRotate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    autoRotateRef.current = false;
    if (sceneRef.current) {
      rotationRef.current = { x: -25 + y * -20, y: -35 + x * 60 };
      sceneRef.current.style.transform =
        `rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`;
    }
  }

  function handleMouseLeave() {
    autoRotateRef.current = true;
  }

  return (
    <div
      className="w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ perspective: "1200px", perspectiveOrigin: "50% 40%" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Scene */}
      <div
        ref={sceneRef}
        className="relative transition-transform duration-100"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(-25deg) rotateY(-35deg)",
          width: 340, height: 240,
        }}
      >
        {/* ══ GROUND / GARDEN ══ */}
        <div style={{
          position: "absolute", width: 420, height: 380, left: -40, top: 60,
          background: "linear-gradient(135deg, #86efac 0%, #4ade80 40%, #22c55e 100%)",
          transform: "rotateX(90deg) translateZ(-60px)",
          transformStyle: "preserve-3d",
          borderRadius: 16,
          boxShadow: "0 0 80px rgba(34,197,94,0.3)",
        }}>
          {/* Grass texture lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", top: 20 + i * 44, left: 20, right: 20, height: 1,
              background: "rgba(22,163,74,0.2)",
            }} />
          ))}
          {/* Garden path */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 50, height: 120,
            background: "linear-gradient(180deg, #d6d3d1 0%, #a8a29e 100%)",
            borderRadius: "8px 8px 0 0",
          }} />
        </div>

        {/* ══ POOL ══ */}
        <div style={{
          position: "absolute", width: 120, height: 80,
          left: -30, top: 120,
          transform: "rotateX(90deg) translateZ(-58px)",
          background: "linear-gradient(135deg, #67e8f9 0%, #22d3ee 30%, #06b6d4 70%, #0891b2 100%)",
          borderRadius: 12,
          boxShadow: "inset 0 2px 20px rgba(6,182,212,0.5), 0 0 40px rgba(34,211,238,0.3)",
          border: "3px solid #e7e5e4",
        }}>
          {/* Water ripples */}
          <div style={{
            position: "absolute", inset: 8, borderRadius: 8,
            background: "repeating-linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 25%, transparent 50%)",
            animation: "waterRipple 3s linear infinite",
          }} />
        </div>

        {/* ══ MAIN BUILDING — FRONT WALL ══ */}
        <div style={{
          position: "absolute", width: 260, height: 140, left: 40, top: 50,
          background: "linear-gradient(180deg, #fafaf9 0%, #f5f5f4 60%, #e7e5e4 100%)",
          transform: "translateZ(60px)",
          boxShadow: "inset -2px 0 8px rgba(0,0,0,0.05)",
          borderBottom: "3px solid #d6d3d1",
        }}>
          {/* Door */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: 36, height: 60,
            background: "linear-gradient(180deg, #78350f 0%, #92400e 50%, #78350f 100%)",
            borderRadius: "6px 6px 0 0",
            boxShadow: "inset -3px 0 6px rgba(0,0,0,0.3), 0 0 12px rgba(120,53,15,0.2)",
          }}>
            {/* Door handle */}
            <div style={{
              position: "absolute", right: 6, top: "50%",
              width: 4, height: 4, borderRadius: "50%",
              background: "#fbbf24",
              boxShadow: "0 0 6px rgba(251,191,36,0.6)",
            }} />
            {/* Door arch */}
            <div style={{
              position: "absolute", top: -1, left: -1, right: -1, height: 8,
              background: "#78350f",
              borderRadius: "6px 6px 0 0",
            }} />
          </div>

          {/* Windows row 1 */}
          {[0, 1, 2].map(i => i !== 1 && (
            <div key={i} style={{
              position: "absolute", bottom: 18,
              left: i === 0 ? 28 : undefined,
              right: i === 2 ? 28 : undefined,
              width: 40, height: 45,
              background: "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 40%, #60a5fa 100%)",
              borderRadius: 4,
              border: "3px solid #e7e5e4",
              boxShadow: "inset 0 0 10px rgba(96,165,250,0.3), 0 0 8px rgba(96,165,250,0.15)",
            }}>
              {/* Window cross */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "#d6d3d1" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#d6d3d1" }} />
              {/* Reflection */}
              <div style={{
                position: "absolute", top: 3, left: 3, width: 12, height: 8,
                background: "rgba(255,255,255,0.5)", borderRadius: 2,
              }} />
            </div>
          ))}

          {/* Upper windows */}
          {[0, 1, 2].map(i => (
            <div key={`u${i}`} style={{
              position: "absolute", top: 18,
              left: i === 0 ? 28 : i === 1 ? 110 : undefined,
              right: i === 2 ? 28 : undefined,
              width: 40, height: 35,
              background: "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 50%, #60a5fa 100%)",
              borderRadius: 4,
              border: "3px solid #e7e5e4",
              boxShadow: "inset 0 0 10px rgba(96,165,250,0.3)",
            }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "#d6d3d1" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#d6d3d1" }} />
              <div style={{ position: "absolute", top: 3, left: 3, width: 10, height: 6, background: "rgba(255,255,255,0.45)", borderRadius: 2 }} />
            </div>
          ))}
        </div>

        {/* ══ BACK WALL ══ */}
        <div style={{
          position: "absolute", width: 260, height: 140, left: 40, top: 50,
          background: "linear-gradient(180deg, #e7e5e4 0%, #d6d3d1 100%)",
          transform: "translateZ(-60px)",
        }} />

        {/* ══ LEFT WALL ══ */}
        <div style={{
          position: "absolute", width: 120, height: 140, left: 40, top: 50,
          background: "linear-gradient(180deg, #e7e5e4 0%, #d6d3d1 60%, #c7c5c3 100%)",
          transform: "rotateY(-90deg) translateZ(0px)",
          transformOrigin: "left center",
        }}>
          {/* Side windows */}
          {[0, 1].map(i => (
            <div key={`s${i}`} style={{
              position: "absolute",
              top: i === 0 ? 18 : undefined,
              bottom: i === 1 ? 18 : undefined,
              left: 20, width: 35, height: i === 0 ? 35 : 45,
              background: "linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%)",
              borderRadius: 4, border: "3px solid #d6d3d1",
              boxShadow: "inset 0 0 8px rgba(96,165,250,0.3)",
            }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "#c7c5c3" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#c7c5c3" }} />
            </div>
          ))}
          {/* Side window right */}
          <div style={{
            position: "absolute", top: 60, right: 18,
            width: 30, height: 40,
            background: "linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%)",
            borderRadius: 4, border: "3px solid #d6d3d1",
          }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "#c7c5c3" }} />
          </div>
        </div>

        {/* ══ RIGHT WALL ══ */}
        <div style={{
          position: "absolute", width: 120, height: 140, left: 40, top: 50,
          background: "linear-gradient(180deg, #f5f5f4 0%, #e7e5e4 60%, #d6d3d1 100%)",
          transform: "rotateY(-90deg) translateZ(-260px)",
          transformOrigin: "left center",
        }}>
          {[0, 1].map(i => (
            <div key={`r${i}`} style={{
              position: "absolute",
              top: i === 0 ? 18 : undefined,
              bottom: i === 1 ? 18 : undefined,
              left: 25, width: 35, height: i === 0 ? 35 : 45,
              background: "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 50%, #60a5fa 100%)",
              borderRadius: 4, border: "3px solid #e7e5e4",
              boxShadow: "inset 0 0 8px rgba(96,165,250,0.3)",
            }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "#d6d3d1" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#d6d3d1" }} />
            </div>
          ))}
        </div>

        {/* ══ ROOF ══ */}
        {/* Roof - front slope */}
        <div style={{
          position: "absolute", width: 280, height: 85, left: 30, top: 5,
          background: "linear-gradient(180deg, #b45309 0%, #92400e 40%, #78350f 100%)",
          transform: "rotateX(35deg) translateZ(40px)",
          transformOrigin: "bottom center",
          borderRadius: "4px 4px 0 0",
          boxShadow: "0 -4px 20px rgba(180,83,9,0.3)",
        }}>
          {/* Roof tiles pattern */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: 0, right: 0,
              top: 8 + i * 16, height: 1,
              background: "rgba(120,53,15,0.4)",
            }} />
          ))}
        </div>
        {/* Roof - back slope */}
        <div style={{
          position: "absolute", width: 280, height: 85, left: 30, top: 5,
          background: "linear-gradient(180deg, #78350f 0%, #713f12 100%)",
          transform: "rotateX(-35deg) translateZ(-40px)",
          transformOrigin: "bottom center",
          borderRadius: "4px 4px 0 0",
        }} />
        {/* Roof ridge cap */}
        <div style={{
          position: "absolute", width: 280, height: 8, left: 30, top: -4,
          background: "linear-gradient(180deg, #d97706 0%, #b45309 100%)",
          transform: "translateZ(0px)",
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(217,119,6,0.3)",
        }} />

        {/* ══ CHIMNEY ══ */}
        <div style={{
          position: "absolute", width: 20, height: 35, left: 240, top: -20,
          transformStyle: "preserve-3d",
        }}>
          {/* Chimney front */}
          <div style={{
            position: "absolute", width: 20, height: 35,
            background: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
            transform: "translateZ(8px)",
            borderRadius: "2px 2px 0 0",
          }} />
          {/* Chimney side */}
          <div style={{
            position: "absolute", width: 16, height: 35,
            background: "#991b1b",
            transform: "rotateY(-90deg) translateZ(-2px)",
            transformOrigin: "left center",
          }} />
          {/* Chimney top */}
          <div style={{
            position: "absolute", width: 24, height: 18, left: -2, top: -2,
            background: "#7f1d1d",
            transform: "rotateX(90deg) translateZ(17px)",
            borderRadius: 2,
          }} />
          {/* Smoke */}
          <div style={{
            position: "absolute", width: 8, height: 8, left: 6, top: -14,
            background: "rgba(163,163,163,0.4)", borderRadius: "50%",
            animation: "smokeRise 3s ease-out infinite",
          }} />
          <div style={{
            position: "absolute", width: 6, height: 6, left: 9, top: -10,
            background: "rgba(163,163,163,0.3)", borderRadius: "50%",
            animation: "smokeRise 3s ease-out 1s infinite",
          }} />
        </div>

        {/* ══ TERRACE / PORCH ══ */}
        <div style={{
          position: "absolute", width: 100, height: 40, left: 120, top: 168,
          transform: "rotateX(90deg) translateZ(-22px)",
          background: "linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)",
          borderRadius: 4,
          border: "2px solid #c7c5c3",
        }} />
        {/* Porch columns */}
        {[0, 1].map(i => (
          <div key={`col${i}`} style={{
            position: "absolute",
            left: i === 0 ? 125 : 210,
            top: 148, width: 6, height: 42,
            background: "linear-gradient(90deg, #f5f5f4, #e7e5e4)",
            transform: "translateZ(78px)",
            borderRadius: 3,
            boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
          }} />
        ))}

        {/* ══ TREES ══ */}
        {[
          { x: -20, z: 35, s: 1 },
          { x: 310, z: 25, s: 0.85 },
          { x: 320, z: -30, s: 0.7 },
        ].map((tree, i) => (
          <div key={`tree${i}`} style={{
            position: "absolute", left: tree.x, top: 70,
            transformStyle: "preserve-3d",
            transform: `translateZ(${tree.z}px) scale(${tree.s})`,
          }}>
            {/* Trunk */}
            <div style={{
              width: 10, height: 50, margin: "0 auto",
              background: "linear-gradient(90deg, #92400e, #78350f)",
              borderRadius: 3,
            }} />
            {/* Foliage layers */}
            {[0, 1, 2].map(j => (
              <div key={j} style={{
                position: "absolute",
                left: "50%",
                top: -10 - j * 18,
                transform: "translateX(-50%)",
                width: 50 - j * 8,
                height: 30 - j * 4,
                background: `linear-gradient(180deg, ${j === 0 ? "#22c55e" : j === 1 ? "#16a34a" : "#15803d"} 0%, ${j === 0 ? "#16a34a" : j === 1 ? "#15803d" : "#166534"} 100%)`,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                boxShadow: j === 0 ? "0 4px 12px rgba(22,163,74,0.3)" : "none",
              }} />
            ))}
          </div>
        ))}

        {/* ══ SHADOW ══ */}
        <div style={{
          position: "absolute", width: 300, height: 140, left: 50, top: 120,
          background: "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)",
          transform: "rotateX(90deg) translateZ(-62px)",
          filter: "blur(8px)",
        }} />
      </div>
    </div>
  );
}

/* ═══════════════ Main Page ═══════════════ */

export default function ComeFunzionaPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const hero = useInView(0.1);
  const steps = useInView(0.1);
  const features = useInView(0.1);
  const stats = useInView(0.1);
  const cta = useInView(0.1);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ═══ Global 3D Keyframes ═══ */}
      <style>{`
        @keyframes float3d {
          0%, 100% { transform: translateY(0) rotateX(0deg) rotateZ(0deg); }
          25% { transform: translateY(-20px) rotateX(15deg) rotateZ(5deg); }
          50% { transform: translateY(-8px) rotateX(-10deg) rotateZ(-3deg); }
          75% { transform: translateY(-25px) rotateX(8deg) rotateZ(4deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        @keyframes spinSlow {
          0% { transform: rotateY(0deg) rotateX(20deg); }
          100% { transform: rotateY(360deg) rotateX(20deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px) rotateX(8deg); }
          to { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale3d(0.7, 0.7, 0.7) rotateY(-15deg); }
          to { opacity: 1; transform: scale3d(1, 1, 1) rotateY(0deg); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.15); }
          50% { box-shadow: 0 0 60px rgba(245, 158, 11, 0.3); }
        }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        @keyframes waterRipple {
          0% { background-position: 0 0; }
          100% { background-position: 100px 0; }
        }
        @keyframes smokeRise {
          0% { opacity: 0.5; transform: translateY(0) scale(1); }
          50% { opacity: 0.3; transform: translateY(-18px) scale(1.6); }
          100% { opacity: 0; transform: translateY(-40px) scale(2.2); }
        }
      `}</style>

      {/* ═══ Header ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-7 h-7 text-neutral-900" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-xl font-semibold text-neutral-900 tracking-tight">LuxuryStay</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
              Esplora
            </Link>
            {user ? (
              <Link href="/dashboard" className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
                Accedi
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section ref={hero.ref} className="relative pt-28 pb-12 lg:pt-36 lg:pb-20 overflow-hidden" style={{ perspective: "1200px" }}>
        {/* Floating background shapes */}
        <FloatingShape delay={0} size={100} color="bg-amber-400/10" top="15%" left="8%" />
        <FloatingShape delay={1.5} size={70} color="bg-violet-400/10" top="25%" right="12%" />
        <FloatingShape delay={3} size={50} color="bg-emerald-400/10" bottom="20%" left="15%" />
        <FloatingShape delay={2} size={90} color="bg-rose-400/8" bottom="25%" right="8%" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className={`${hero.inView ? "animate-slideUp" : "opacity-0"}`}>
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/50 rounded-full px-4 py-1.5 mb-8">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-sm font-medium text-amber-800">La piattaforma luxury n.1 in Italia</span>
                </div>
              </div>

              <h1 className={`text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-900 tracking-tight leading-[0.95] mb-6 ${hero.inView ? "animate-slideUp delay-100" : "opacity-0"}`}>
                <span className="block">Come</span>
                <span className="block bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  Funziona
                </span>
              </h1>

              <p className={`text-lg lg:text-xl text-neutral-500 max-w-lg leading-relaxed ${hero.inView ? "animate-slideUp delay-200" : "opacity-0"}`}>
                Prenota alloggi di lusso in tre semplici passaggi. Senza complicazioni, senza stress.
              </p>

              <div className={`mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start ${hero.inView ? "animate-slideUp delay-300" : "opacity-0"}`}>
                <Link href="/"
                  className="px-6 py-3.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all active:scale-[0.97]">
                  Esplora la mappa
                </Link>
                <Link href="/register"
                  className="px-6 py-3.5 bg-white border border-neutral-300 text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-all">
                  Crea un account
                </Link>
              </div>
            </div>

            {/* Right — 3D Villa */}
            <div className={`flex-1 min-h-[350px] lg:min-h-[450px] flex items-center justify-center ${hero.inView ? "animate-scaleIn delay-200" : "opacity-0"}`}>
              <Villa3D />
            </div>
          </div>

          {/* Interactive hint */}
          <p className={`text-center text-xs text-neutral-400 mt-4 lg:mt-8 ${hero.inView ? "animate-slideUp delay-500" : "opacity-0"}`}>
            Muovi il mouse sulla villa per ruotarla in 3D
          </p>
        </div>
      </section>

      {/* ═══ 3 STEPS ═══ */}
      <section ref={steps.ref} className="py-24 lg:py-36 bg-neutral-950 relative overflow-hidden" style={{ perspective: "1200px" }}>
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`text-center mb-20 ${steps.inView ? "animate-slideUp" : "opacity-0"}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Tre passaggi. Nessuno stress.</h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
              Dalla ricerca alla prenotazione in meno di 5 minuti.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Esplora la mappa",
                desc: "Naviga la mappa interattiva e scopri ville, appartamenti e strutture luxury in tutta Italia. Filtra per date, ospiti e zona.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                ),
                gradient: "from-blue-500 to-cyan-400",
              },
              {
                step: "02",
                title: "Scegli il tuo alloggio",
                desc: "Visualizza foto in alta risoluzione, servizi disponibili, posizione esatta e recensioni degli ospiti. Trova il posto perfetto per te.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                ),
                gradient: "from-amber-500 to-orange-400",
              },
              {
                step: "03",
                title: "Prenota in un click",
                desc: "Seleziona le date, il numero di ospiti e invia la richiesta. Puoi prenotare anche senza registrarti, come ospite.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
                gradient: "from-emerald-500 to-green-400",
              },
            ].map((item, i) => (
              <div key={i} className={`${steps.inView ? "animate-scaleIn" : "opacity-0"}`} style={{ animationDelay: `${0.15 + i * 0.15}s` }}>
                <TiltCard className="h-full">
                  <div className="relative bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10 h-full group hover:border-white/20 transition-colors"
                    style={{ transformStyle: "preserve-3d" }}>
                    {/* Glow effect */}
                    <div className={`absolute -inset-px rounded-3xl bg-gradient-to-b ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-sm`} />

                    {/* Step number */}
                    <div className="relative" style={{ transform: "translateZ(40px)" }}>
                      <span className={`text-7xl lg:text-8xl font-black bg-gradient-to-b ${item.gradient} bg-clip-text text-transparent opacity-20 select-none`}>
                        {item.step}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-5 -mt-8 relative`}
                      style={{ transform: "translateZ(50px)", animation: "glow 3s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}>
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div style={{ transform: "translateZ(30px)" }}>
                      <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-neutral-400 leading-relaxed text-[15px]">{item.desc}</p>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-6 right-6 w-16 h-16 rounded-full border border-white/5" style={{ transform: "translateZ(20px)" }} />
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>

          {/* Connection line */}
          <div className="hidden lg:flex items-center justify-center mt-12 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${i === 2 ? "bg-emerald-400" : i === 1 ? "bg-amber-400" : "bg-blue-400"}`}
                  style={{ animation: `glow 2s ease-in-out ${i * 0.3}s infinite` }} />
                {i < 2 && <div className="w-32 h-px bg-gradient-to-r from-white/20 to-white/5" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section ref={features.ref} className="py-24 lg:py-36 relative" style={{ perspective: "1000px" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className={`text-center mb-20 ${features.inView ? "animate-slideUp" : "opacity-0"}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">Perché LuxuryStay</h2>
            <p className="text-neutral-500 text-lg max-w-xl mx-auto">
              Non siamo la solita piattaforma. Ecco cosa ci rende diversi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Prenota senza account",
                desc: "Non serve registrarsi. Inserisci nome, email e telefono e prenota come ospite in pochi secondi.",
                icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
                bg: "bg-violet-50",
                accent: "text-violet-600",
              },
              {
                title: "Mappa interattiva",
                desc: "Esplora gli alloggi direttamente sulla mappa con marker 3D. Vedi prezzi e foto al passaggio del mouse.",
                icon: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z",
                bg: "bg-blue-50",
                accent: "text-blue-600",
              },
              {
                title: "Solo strutture verificate",
                desc: "Ogni alloggio è selezionato e verificato dal nostro team. Qualità garantita per ogni soggiorno.",
                icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
                bg: "bg-emerald-50",
                accent: "text-emerald-600",
              },
              {
                title: "Cancellazione gratuita",
                desc: "Cambi idea? Cancella gratuitamente entro 48 ore dalla prenotazione e ricevi un rimborso completo.",
                icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
                bg: "bg-amber-50",
                accent: "text-amber-600",
              },
            ].map((feat, i) => (
              <div key={i} className={`${features.inView ? "animate-scaleIn" : "opacity-0"}`} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                <TiltCard className="h-full">
                  <div className={`${feat.bg} rounded-2xl p-8 lg:p-10 h-full border border-transparent hover:border-neutral-200 transition-all group`}
                    style={{ transformStyle: "preserve-3d" }}>
                    <div className={`w-12 h-12 rounded-xl ${feat.bg} ${feat.accent} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                      style={{ transform: "translateZ(40px)" }}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={feat.icon} />
                      </svg>
                    </div>
                    <div style={{ transform: "translateZ(25px)" }}>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">{feat.title}</h3>
                      <p className="text-neutral-600 text-[15px] leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section ref={stats.ref} className="py-24 lg:py-32 bg-gradient-to-b from-neutral-50 to-white relative overflow-hidden">
        {/* Decorative 3D shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-3xl border border-neutral-200/50 opacity-40"
          style={{ animation: "float3d 8s ease-in-out infinite", transform: "rotateX(20deg) rotateY(20deg)" }} />
        <div className="absolute bottom-10 right-10 w-24 h-24 rounded-2xl border border-neutral-200/50 opacity-30"
          style={{ animation: "float3d 10s ease-in-out 2s infinite", transform: "rotateX(-15deg) rotateY(25deg)" }} />

        <div className="max-w-5xl mx-auto px-4">
          <div className={`text-center mb-16 ${stats.inView ? "animate-slideUp" : "opacity-0"}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">I numeri parlano</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: 150, suffix: "+", label: "Alloggi luxury" },
              { value: 2500, suffix: "+", label: "Ospiti soddisfatti" },
              { value: 50, suffix: "+", label: "Città coperte" },
              { value: 98, suffix: "%", label: "Tasso di soddisfazione" },
            ].map((stat, i) => (
              <div key={i} className={`text-center ${stats.inView ? "animate-scaleIn" : "opacity-0"}`}
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                <TiltCard>
                  <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-neutral-100"
                    style={{ transformStyle: "preserve-3d" }}>
                    <p className="text-4xl lg:text-5xl font-black text-neutral-900 mb-2"
                      style={{ transform: "translateZ(30px)" }}>
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-sm text-neutral-500 font-medium" style={{ transform: "translateZ(15px)" }}>
                      {stat.label}
                    </p>
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={cta.ref} className="py-24 lg:py-36 relative overflow-hidden" style={{ perspective: "1000px" }}>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className={`${cta.inView ? "animate-slideUp" : "opacity-0"}`}>
            <TiltCard>
              <div className="bg-neutral-950 rounded-3xl p-12 lg:p-20 relative overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}>
                {/* Animated gradient background */}
                <div className="absolute -top-1/2 -left-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
                <div className="absolute -bottom-1/2 -right-1/2 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[100px] animate-pulse" style={{ animationDuration: "12s" }} />

                <div style={{ transform: "translateZ(40px)" }}>
                  <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    Pronto a trovare il tuo<br />
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">alloggio dei sogni?</span>
                  </h2>
                  <p className="text-neutral-400 text-lg mb-10 max-w-lg mx-auto">
                    Esplora la mappa e scopri centinaia di strutture luxury in tutta Italia.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/"
                      className="px-8 py-4 bg-white text-neutral-900 rounded-xl text-base font-semibold hover:bg-neutral-100 transition-all active:scale-[0.97] shadow-lg shadow-white/10">
                      Esplora la mappa
                    </Link>
                    {!user && (
                      <Link href="/register"
                        className="px-8 py-4 bg-white/10 text-white rounded-xl text-base font-semibold hover:bg-white/15 transition-all border border-white/10">
                        Crea un account
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-neutral-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">&copy; 2026 LuxuryStay. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Home</Link>
            <Link href="/come-funziona" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Come funziona</Link>
            <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Accedi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
