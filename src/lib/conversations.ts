import { createClient } from "@/lib/supabase/client";

export interface ConversationPreview {
  id: string;
  property_id: string | null;
  guest_id: string;
  host_id: string;
  last_message_at: string;
  created_at: string;
  other_party_name: string;
  other_party_avatar: string | null;
  property_title: string | null;
  last_message: string | null;
  unread_count: number;
}

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = createClient();

  // Fetch conversations where user is participant
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (!conversations || conversations.length === 0) return [];

  // Get other party IDs
  const otherIds = conversations.map((c) =>
    c.guest_id === userId ? c.host_id : c.guest_id
  );
  const uniqueOtherIds = [...new Set(otherIds)];

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", uniqueOtherIds);
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  // Fetch property titles
  const propertyIds = conversations.map((c) => c.property_id).filter(Boolean);
  const uniquePropertyIds = [...new Set(propertyIds)];
  let propertyMap = new Map<string, string>();
  if (uniquePropertyIds.length > 0) {
    const { data: properties } = await supabase
      .from("properties")
      .select("id, title")
      .in("id", uniquePropertyIds);
    propertyMap = new Map(properties?.map((p) => [p.id, p.title]) || []);
  }

  // Fetch last message for each conversation
  const convIds = conversations.map((c) => c.id);
  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  // Get first (latest) message per conversation
  const lastMsgMap = new Map<string, string>();
  for (const msg of lastMessages || []) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg.content);
    }
  }

  // Count unread messages
  const { data: unreadData } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", convIds)
    .neq("sender_id", userId)
    .is("read_at", null);

  const unreadMap = new Map<string, number>();
  for (const msg of unreadData || []) {
    unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
  }

  return conversations.map((c) => {
    const otherId = c.guest_id === userId ? c.host_id : c.guest_id;
    const profile = profileMap.get(otherId);
    return {
      ...c,
      other_party_name: profile?.full_name || "Utente",
      other_party_avatar: profile?.avatar_url || null,
      property_title: c.property_id ? propertyMap.get(c.property_id) || null : null,
      last_message: lastMsgMap.get(c.id) || null,
      unread_count: unreadMap.get(c.id) || 0,
    };
  });
}

export async function getOrCreateConversation(
  guestId: string,
  hostId: string,
  propertyId: string | null
): Promise<string> {
  const supabase = createClient();

  // Check existing
  let query = supabase
    .from("conversations")
    .select("id")
    .eq("guest_id", guestId)
    .eq("host_id", hostId);

  if (propertyId) query = query.eq("property_id", propertyId);

  const { data: existing } = await query.limit(1).single();
  if (existing) return existing.id;

  // Create new
  const { data: created } = await supabase
    .from("conversations")
    .insert({ guest_id: guestId, host_id: hostId, property_id: propertyId })
    .select("id")
    .single();

  return created!.id;
}

export async function markAsRead(conversationId: string, userId: string) {
  const supabase = createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}
