"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getConversations, type ConversationPreview } from "@/lib/conversations";

/* ============= Helpers ============= */

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Ieri";
  if (diffDays < 7) return d.toLocaleDateString("it-IT", { weekday: "short" });
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const FILTERS = ["Tutti", "Alloggi", "Supporto"];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

/* ============= Filter Chips ============= */

function FilterChips({
  filters,
  active,
  onChange,
}: {
  filters: string[];
  active: string;
  onChange: (f: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
            active === f
              ? "bg-neutral-900 text-white"
              : "bg-white border border-neutral-200 text-neutral-600"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

/* ============= Loading Skeleton ============= */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-neutral-100 rounded-full animate-pulse" />
        ))}
      </div>
      {/* AI row skeleton */}
      <div className="h-20 bg-neutral-100 rounded-2xl animate-pulse" />
      {/* Conversation skeletons */}
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-neutral-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ============= AI Concierge Row ============= */

function AIConciergeRow() {
  return (
    <Link href="/dashboard/messages/ai">
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">LS</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-neutral-900">Assistenza LuxuryStay</p>
          <p className="text-xs text-neutral-500">Chiedi al concierge AI</p>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
      </div>
    </Link>
  );
}

/* ============= Conversation Row ============= */

function ConversationRow({
  conversation,
  index,
}: {
  conversation: ConversationPreview;
  index: number;
}) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={fadeUp}>
      <Link href={`/dashboard/messages/${conversation.id}`}>
        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50 transition">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
            {conversation.other_party_avatar ? (
              <img
                src={conversation.other_party_avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-sm font-semibold text-neutral-600">
                {getInitials(conversation.other_party_name)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-neutral-900 truncate">
                {conversation.other_party_name}
              </p>
              <span className="text-xs text-neutral-400 ml-auto shrink-0">
                {formatRelativeDate(conversation.last_message_at)}
              </span>
            </div>
            {conversation.last_message && (
              <p className="text-sm text-neutral-500 truncate mt-0.5">
                {conversation.last_message}
              </p>
            )}
            {conversation.property_title && (
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {conversation.property_title}
              </p>
            )}
          </div>

          {/* Unread badge */}
          {conversation.unread_count > 0 && (
            <div className="min-w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
              {conversation.unread_count}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* ============= Main Page ============= */

export default function MessagesPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [filter, setFilter] = useState("Tutti");
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const data = await getConversations(user.id);
    setConversations(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to realtime message inserts to refresh list
  useEffect(() => {
    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadConversations]);

  if (loading) return <LoadingSkeleton />;

  // Filter logic
  const showAI = filter === "Tutti" || filter === "Supporto";
  const showConversations = filter !== "Supporto";
  const filteredConversations = showConversations
    ? filter === "Alloggi"
      ? conversations.filter((c) => c.property_id !== null)
      : conversations
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Messaggi</h1>

      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      {showAI && <AIConciergeRow />}

      {filteredConversations.length > 0 ? (
        <div className="space-y-1">
          {filteredConversations.map((conversation, i) => (
            <ConversationRow key={conversation.id} conversation={conversation} index={i} />
          ))}
        </div>
      ) : (
        showConversations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-neutral-900 mb-1">
              Nessuna conversazione
            </p>
            <p className="text-xs text-neutral-400">
              Le tue conversazioni appariranno qui
            </p>
          </motion.div>
        )
      )}
    </div>
  );
}
