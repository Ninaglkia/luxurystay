// src/app/api/chat/route.ts
// AI concierge chat endpoint — streaming, server-only
// Sources: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
//          https://vercel.com/docs/functions/configuring-functions/duration

import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Required: explicit timeout for Vercel streaming reliability
// 30s is safe for all plans with Fluid Compute enabled (Hobby max 300s, Pro max 800s)
// Without this export, Hobby plan without Fluid Compute defaults to 10s — kills streaming
export const maxDuration = 30

export async function POST(req: Request) {
  let messages: UIMessage[]

  try {
    const body = await req.json()
    messages = body.messages
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages must be an array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const result = streamText({
    model: anthropic('claude-haiku-4-5'),
    system: 'You are a helpful AI concierge for LuxuryStay vacation rentals. Be warm, professional, and concise.',
    // convertToModelMessages transforms UIMessage[] (client format) → ModelMessage[] (model format)
    // Required: passing UIMessage[] directly to streamText causes a type error
    messages: await convertToModelMessages(messages),
    // Limit response length — important for cost control from day one
    maxOutputTokens: 500,
  })

  // toUIMessageStreamResponse() is required (not toDataStreamResponse()) for useChat hook
  // compatibility in Phase 7+ UI. Use this method consistently.
  return result.toUIMessageStreamResponse()
}
