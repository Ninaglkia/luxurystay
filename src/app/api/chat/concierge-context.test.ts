import { describe, it, expect } from 'vitest'
import { buildConciergeContext } from './concierge-context'
import { PropertyRecord } from './property-context'

function makeFullProperty(overrides?: Partial<PropertyRecord>): PropertyRecord {
  return {
    title: 'Villa Amalfi',
    description: null,
    address: 'Via Marina Grande 12, Amalfi, SA',
    lat: 40.6342,
    lng: 14.6026,
    price: 500,
    category: 'villa',
    space_type: 'entire_place',
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: ['wifi', 'piscina'],
    cancellation_policy: 'moderata',
    checkin_time: '15:00',
    checkout_time: '11:00',
    house_rules: null,
    ...overrides,
  }
}

describe('buildConciergeContext', () => {
  it('includes CONCIERGE CONTEXT header', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('CONCIERGE CONTEXT')
  })

  it('includes address when present', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('Property address: Via Marina Grande 12, Amalfi, SA')
  })

  it('includes coordinates when both lat and lng are present', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('Coordinates: 40.6342, 14.6026')
  })

  it('omits coordinates when lat is null', () => {
    const result = buildConciergeContext(makeFullProperty({ lat: null }))
    expect(result).not.toContain('Coordinates')
  })

  it('includes property category when present', () => {
    const result = buildConciergeContext(makeFullProperty({ category: 'villa' }))
    expect(result).toContain('Property type: villa')
  })

  it('includes the recommendation framing instruction', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('suggestions to explore')
  })

  it('includes guidance for restaurants, transport, activities', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('restaurants')
    expect(result).toContain('transport')
    expect(result).toContain('activities')
  })

  it('acknowledges missing location when both address and lat are null', () => {
    const result = buildConciergeContext(makeFullProperty({ address: null, lat: null, lng: null }))
    expect(result).toContain('Location data is not available')
  })

  it('does not crash on fully null property', () => {
    const minimal: PropertyRecord = {
      title: null, description: null, address: null, lat: null, lng: null,
      price: null, category: null, space_type: null, guests: null,
      bedrooms: null, beds: null, bathrooms: null, amenities: null,
      cancellation_policy: null, checkin_time: null, checkout_time: null, house_rules: null,
    }
    expect(() => buildConciergeContext(minimal)).not.toThrow()
  })
})
