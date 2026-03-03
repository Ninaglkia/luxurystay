// src/app/api/chat/property-context.ts
// Pure property context serialization for system prompt injection
// Phase 04 — Property FAQ Integration

/**
 * Shape of a property row from Supabase `properties` table.
 * All fields nullable — properties may have incomplete data.
 */
export interface PropertyRecord {
  title: string | null
  description: string | null
  address: string | null
  lat: number | null
  lng: number | null
  price: number | null
  category: string | null
  space_type: string | null
  guests: number | null
  bedrooms: number | null
  beds: number | null
  bathrooms: number | null
  amenities: string[] | null
  cancellation_policy: string | null
  checkin_time: string | null
  checkout_time: string | null
  house_rules: string | null
}

/** Maps amenity IDs (from Supabase) to human-readable Italian labels */
const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  tv: 'TV',
  cucina: 'Cucina',
  lavatrice: 'Lavatrice',
  aria: 'Aria condizionata',
  piscina: 'Piscina privata',
  parcheggio: 'Garage gratuito in loco',
  riscaldamento: 'Riscaldamento',
  giardino: 'Giardino',
  animali: 'Animali domestici ammessi',
}

/** Maps cancellation policy codes to full Italian descriptions */
const CANCELLATION_LABELS: Record<string, string> = {
  flessibile:
    'Cancellazione gratuita fino a 24 ore prima del check-in. Rimborso del 50% nelle ultime 24 ore.',
  moderata:
    'Cancellazione gratuita fino a 5 giorni prima. Rimborso del 50% tra 5 giorni e 24 ore prima.',
  rigida:
    'Rimborso del 50% solo fino a 7 giorni prima del check-in. Nessun rimborso dopo.',
}

const DESCRIPTION_MAX_LENGTH = 500

/**
 * Serializes a Supabase property row into a structured context block
 * for injection into the AI system prompt.
 *
 * - Only includes non-null fields
 * - Maps amenity IDs to human-readable labels
 * - Maps cancellation policy codes to full descriptions
 * - Truncates description to 500 chars
 * - Appends never-invent instruction
 */
export function buildPropertyContext(property: PropertyRecord): string {
  const lines: string[] = [
    'PROPERTY CONTEXT (use ONLY this data to answer property questions):',
  ]

  if (property.title) {
    lines.push(`Name: ${property.title}`)
  }

  if (property.address) {
    lines.push(`Address: ${property.address}`)
  }

  if (property.lat != null && property.lng != null) {
    lines.push(`Coordinates: ${property.lat}, ${property.lng}`)
  }

  if (property.price != null) {
    lines.push(`Price per night: ${property.price}`)
  }

  if (property.guests != null) {
    lines.push(`Maximum guests: ${property.guests}`)
  }

  if (property.bedrooms != null) {
    lines.push(`Bedrooms: ${property.bedrooms}`)
  }

  if (property.beds != null) {
    lines.push(`Beds: ${property.beds}`)
  }

  if (property.bathrooms != null) {
    lines.push(`Bathrooms: ${property.bathrooms}`)
  }

  if (property.checkin_time) {
    lines.push(`Check-in time: ${property.checkin_time}`)
  }

  if (property.checkout_time) {
    lines.push(`Check-out time: ${property.checkout_time}`)
  }

  // Amenities: map IDs to labels, fall back to raw ID for unknowns
  if (property.amenities && property.amenities.length > 0) {
    const mapped = property.amenities.map((id) => AMENITY_LABELS[id] ?? id)
    lines.push(`Amenities: ${mapped.join(', ')}`)
  } else {
    lines.push('Amenities: not specified')
  }

  // Cancellation policy: map code to full description
  if (property.cancellation_policy) {
    const label =
      CANCELLATION_LABELS[property.cancellation_policy] ?? property.cancellation_policy
    lines.push(`Cancellation policy: ${label}`)
  }

  // House rules
  if (property.house_rules) {
    lines.push(`House rules: ${property.house_rules}`)
  }

  // Description (truncated)
  if (property.description) {
    const desc =
      property.description.length > DESCRIPTION_MAX_LENGTH
        ? property.description.slice(0, DESCRIPTION_MAX_LENGTH) + '...'
        : property.description
    lines.push(`Description: ${desc}`)
  }

  // Never-invent instruction (always appended)
  lines.push('')
  lines.push(
    'IMPORTANT: If a property field is not listed above, say "I don\'t have that information for this property." NEVER invent or guess.'
  )

  // Contextual unavailability notes
  if (!property.checkin_time || !property.checkout_time) {
    lines.push(
      'Check-in/check-out times are not available for this property \u2014 acknowledge this honestly if asked.'
    )
  }

  if (!property.house_rules) {
    lines.push(
      'House rules are not available for this property \u2014 acknowledge this honestly if asked.'
    )
  }

  return lines.join('\n')
}
