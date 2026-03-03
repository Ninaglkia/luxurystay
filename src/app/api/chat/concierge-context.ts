// src/app/api/chat/concierge-context.ts
// Pure concierge context serialization for system prompt injection
// Phase 06 — Concierge Recommendations

import { PropertyRecord } from './property-context'

/**
 * Serializes property location data into a concierge guidance block
 * for injection into the AI system prompt.
 *
 * - Pure function: no Supabase calls, no external API calls, no side effects
 * - Only uses location fields: address, lat, lng, category
 * - Instructs the AI to draw on its training knowledge for the area
 * - Frames all recommendations as "suggestions to explore, not guaranteed facts"
 */
export function buildConciergeContext(property: PropertyRecord): string {
  const lines: string[] = [
    'CONCIERGE CONTEXT (location-aware recommendations):',
  ]

  if (property.address) {
    lines.push(`Property address: ${property.address}`)
  }

  if (property.lat != null && property.lng != null) {
    lines.push(`Coordinates: ${property.lat}, ${property.lng}`)
  }

  if (property.category) {
    lines.push(`Property type: ${property.category}`)
  }

  lines.push('')
  lines.push(
    'Based on the property location above, you may recommend nearby restaurants, ' +
    'transport options (taxi, trains, car rental, ferries where applicable), ' +
    'and local activities (beaches, excursions, museums, local markets, etc.).'
  )
  lines.push(
    'Draw on your knowledge of this area. Provide specific names when you know them. ' +
    'Frame all recommendations as suggestions to explore — not guaranteed current facts ' +
    '(hours, prices, and availability may have changed). ' +
    'For restaurants: mention the general area/neighborhood and type of cuisine. ' +
    'For transport: mention the most practical options for reaching the property and exploring the region. ' +
    'For activities: mention what the area is known for and specific well-known attractions.'
  )

  if (!property.address && property.lat == null) {
    lines.push(
      'Location data is not available for this property — acknowledge this if asked ' +
      'for local recommendations and suggest the guest contact the host directly.'
    )
  }

  return lines.join('\n')
}
