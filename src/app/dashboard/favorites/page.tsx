"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center mb-8"
      >
        <Heart className="w-12 h-12 text-rose-400" strokeWidth={1.5} />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-2xl font-semibold text-neutral-900 mb-3"
      >
        Nessun preferito ancora
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-neutral-500 text-sm leading-relaxed mb-8"
      >
        Salva gli alloggi che ti piacciono per ritrovarli facilmente e confrontarli prima di prenotare.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors"
        >
          <Search className="w-4 h-4" />
          Esplora alloggi
        </Link>
      </motion.div>
    </div>
  );
}
