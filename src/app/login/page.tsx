"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side — animated branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end p-12 bg-neutral-950">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[100px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "2s" }} />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-emerald-500/8 blur-[80px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "4s" }} />
        </div>

        <div className="absolute top-20 right-16 w-56 h-36 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md rotate-6 flex flex-col justify-between p-5" style={{ animation: "float 6s ease-in-out infinite" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-white/60 text-xs font-medium">Villa Panoramica</span>
          </div>
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider">A notte</p>
            <p className="text-white text-xl font-bold">&euro; 320</p>
          </div>
        </div>

        <div className="absolute top-44 right-40 w-48 h-32 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md -rotate-3 flex flex-col justify-between p-4" style={{ animation: "float 8s ease-in-out 1s infinite" }}>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            ))}
          </div>
          <div>
            <p className="text-white/50 text-xs">&quot;Un soggiorno indimenticabile&quot;</p>
            <p className="text-white/30 text-[10px] mt-1">&mdash; Marco R.</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-5xl font-light tracking-tight mb-4">
            LuxuryStay
          </h1>
          <p className="text-white/60 text-lg max-w-md leading-relaxed">
            Scopri alloggi di lusso selezionati in tutto il mondo.
          </p>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(var(--tw-rotate, 0)); }
            50% { transform: translateY(-12px) rotate(var(--tw-rotate, 0)); }
          }
        `}</style>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white relative overflow-hidden">
        <div className="lg:hidden absolute -top-32 -right-32 w-64 h-64 rounded-full bg-amber-500/5 blur-[80px]" />
        <div className="lg:hidden absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-violet-500/5 blur-[80px]" />

        <div className="w-full max-w-sm relative z-10">
          <h2 className="lg:hidden text-2xl font-light tracking-tight text-neutral-900 mb-2">
            LuxuryStay
          </h2>

          <h3 className="text-2xl font-semibold text-neutral-900 mb-1">
            Bentornato
          </h3>
          <p className="text-neutral-500 text-sm mb-8">
            Accedi al tuo account per continuare
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-xl px-4 py-3.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continua con Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">oppure</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@esempio.com"
                className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">Password</label>
                <Link href="/forgot-password" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Password dimenticata?</Link>
              </div>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-neutral-900 text-white rounded-xl px-4 py-3.5 text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Non hai un account?{" "}
            <Link href="/register" className="text-neutral-900 font-medium hover:underline">Registrati</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
