"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAsRead } from "@/lib/conversations";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface OtherParty {
  full_name: string;
  avatar_url: string | null;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "Oggi";
  if (msgDate.getTime() === yesterday.getTime()) return "Ieri";

  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
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

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherParty, setOtherParty] = useState<OtherParty | null>(null);
  const [propertyTitle, setPropertyTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation data
  useEffect(() => {
    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (!conversation) {
        setLoading(false);
        return;
      }

      // Determine other party
      const otherId =
        conversation.guest_id === user.id
          ? conversation.host_id
          : conversation.guest_id;

      // Fetch other party profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", otherId)
        .single();

      setOtherParty(profile || { full_name: "Utente", avatar_url: null });

      // Fetch property title
      if (conversation.property_id) {
        const { data: property } = await supabase
          .from("properties")
          .select("title")
          .eq("id", conversation.property_id)
          .single();
        setPropertyTitle(property?.title || null);
      }

      // Fetch messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);

      // Mark as read
      await markAsRead(conversationId, user.id);

      setLoading(false);
    }

    load();
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== userId) {
            markAsRead(conversationId, userId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    if (!input.trim() || !userId) return;
    const content = input.trim();
    setInput("");

    // Optimistic add
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: userId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Insert to Supabase
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content,
    });

    // Update conversation last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, [input, userId, conversationId, supabase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const otherName = otherParty?.full_name || "Utente";

  return (
    <div className="-mx-4 -my-6 lg:-mx-8 flex flex-col h-[100dvh] lg:h-screen">
      {/* Header */}
      <div className="px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <Link
            href="/dashboard/messages"
            className="flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          {otherParty?.avatar_url ? (
            <img
              src={otherParty.avatar_url}
              alt={otherName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-600 font-semibold text-xs">
                {getInitials(otherName)}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{otherName}</span>
            {propertyTitle && (
              <span className="text-xs text-neutral-400">{propertyTitle}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8">
        {loading ? (
          <div className="space-y-4 animate-pulse pt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`h-10 rounded-2xl ${i % 2 === 0 ? "bg-neutral-100 w-48" : "bg-neutral-200 w-36"}`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-neutral-400">
              Nessun messaggio. Inizia la conversazione!
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <span className="text-[11px] text-neutral-400 bg-neutral-50 px-3 py-1 rounded-full">
                    {formatDateSeparator(group.date)}
                  </span>
                </div>

                {/* Messages in group */}
                <div className="space-y-2">
                  {group.messages.map((msg) => {
                    const isSent = msg.sender_id === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`px-4 py-2.5 max-w-[80%] ${
                            isSent
                              ? "ml-auto bg-neutral-900 text-white rounded-2xl rounded-br-md"
                              : "mr-auto bg-white border border-neutral-100 rounded-2xl rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-4 lg:px-8 pb-20 lg:pb-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-neutral-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
