/**
 * Tests for buildPropertyContext() — pure property context serialization
 *
 * TDD RED phase: Tests written before implementation.
 * Verifies serialization of Supabase property rows into structured system prompt blocks.
 */

import { describe, it, expect } from 'vitest'
import { buildPropertyContext, PropertyRecord } from './property-context'

function makeFullProperty(overrides?: Partial<PropertyRecord>): PropertyRecord {
  return {
    title: 'Villa Roma',
    description: 'A beautiful luxury villa in the heart of Rome with stunning views.',
    address: 'Via Appia 1, Roma',
    lat: 41.8902,
    lng: 12.4922,
    price: 350,
    category: 'villa',
    space_type: 'entire_place',
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: ['wifi', 'piscina', 'parcheggio', 'aria'],
    cancellation_policy: 'flessibile',
    checkin_time: '15:00',
    checkout_time: '11:00',
    house_rules: 'No smoking. No pets. Quiet hours after 22:00.',
    ...overrides,
  }
}

describe('buildPropertyContext', () => {
  describe('full property record serialization', () => {
    it('serializes a full property record with all fields present', () => {
      const property = makeFullProperty()
      const result = buildPropertyContext(property)

      expect(result).toContain('PROPERTY CONTEXT')
      expect(result).toContain('Villa Roma')
      expect(result).toContain('Via Appia 1, Roma')
      expect(result).toContain('Check-in time: 15:00')
      expect(result).toContain('Check-out time: 11:00')
      expect(result).toContain('House rules: No smoking. No pets. Quiet hours after 22:00.')
    })
  })

  describe('amenity label mapping', () => {
    it('maps amenity "wifi" to "Wi-Fi"', () => {
      const property = makeFullProperty({ amenities: ['wifi'] })
      const result = buildPropertyContext(property)
      expect(result).toContain('Wi-Fi')
    })

    it('maps amenity "piscina" to "Piscina privata"', () => {
      const property = makeFullProperty({ amenities: ['piscina'] })
      const result = buildPropertyContext(property)
      expect(result).toContain('Piscina privata')
    })

    it('maps multiple amenities to human-readable labels', () => {
      const property = makeFullProperty({ amenities: ['wifi', 'piscina', 'aria'] })
      const result = buildPropertyContext(property)
      expect(result).toContain('Wi-Fi')
      expect(result).toContain('Piscina privata')
      expect(result).toContain('Aria condizionata')
    })
  })

  describe('cancellation policy label mapping', () => {
    it('maps cancellation_policy "flessibile" to full description', () => {
      const property = makeFullProperty({ cancellation_policy: 'flessibile' })
      const result = buildPropertyContext(property)
      expect(result).toContain('Cancellazione gratuita fino a 24 ore prima del check-in')
    })

    it('maps cancellation_policy "rigida" to "Rimborso del 50% solo fino a 7 giorni prima"', () => {
      const property = makeFullProperty({ cancellation_policy: 'rigida' })
      const result = buildPropertyContext(property)
      expect(result).toContain('Rimborso del 50% solo fino a 7 giorni prima')
    })

    it('maps cancellation_policy "moderata" to full description', () => {
      const property = makeFullProperty({ cancellation_policy: 'moderata' })
      const result = buildPropertyContext(property)
      expect(result).toContain('Cancellazione gratuita fino a 5 giorni prima')
    })
  })

  describe('null field handling', () => {
    it('omits description line when description is null', () => {
      const property = makeFullProperty({ description: null })
      const result = buildPropertyContext(property)
      expect(result).not.toContain('Description:')
      // Other fields still present
      expect(result).toContain('Villa Roma')
    })

    it('omits checkin_time line when checkin_time is null', () => {
      const property = makeFullProperty({ checkin_time: null })
      const result = buildPropertyContext(property)
      expect(result).not.toContain('Check-in time:')
    })

    it('omits house_rules line when house_rules is null', () => {
      const property = makeFullProperty({ house_rules: null })
      const result = buildPropertyContext(property)
      expect(result).not.toContain('House rules:')
    })

    it('omits checkout_time line when checkout_time is null', () => {
      const property = makeFullProperty({ checkout_time: null })
      const result = buildPropertyContext(property)
      expect(result).not.toContain('Check-out time:')
    })
  })

  describe('description truncation', () => {
    it('truncates description longer than 500 chars', () => {
      const longDescription = 'A'.repeat(600)
      const property = makeFullProperty({ description: longDescription })
      const result = buildPropertyContext(property)
      // Should contain exactly 500 chars of 'A' followed by '...'
      expect(result).toContain('A'.repeat(500) + '...')
      expect(result).not.toContain('A'.repeat(501))
    })

    it('does not truncate description of exactly 500 chars', () => {
      const exactDescription = 'B'.repeat(500)
      const property = makeFullProperty({ description: exactDescription })
      const result = buildPropertyContext(property)
      expect(result).toContain('B'.repeat(500))
      expect(result).not.toContain('...')
    })
  })

  describe('amenities edge cases', () => {
    it('outputs "Amenities: not specified" when amenities is null', () => {
      const property = makeFullProperty({ amenities: null })
      const result = buildPropertyContext(property)
      expect(result).toContain('Amenities: not specified')
    })

    it('outputs "Amenities: not specified" when amenities is empty array', () => {
      const property = makeFullProperty({ amenities: [] })
      const result = buildPropertyContext(property)
      expect(result).toContain('Amenities: not specified')
    })

    it('passes through unknown amenity IDs as-is', () => {
      const property = makeFullProperty({ amenities: ['unknown_amenity'] })
      const result = buildPropertyContext(property)
      expect(result).toContain('unknown_amenity')
    })
  })

  describe('never-invent instruction', () => {
    it('always ends with instruction containing "NEVER invent"', () => {
      const property = makeFullProperty()
      const result = buildPropertyContext(property)
      expect(result).toContain('NEVER invent')
    })

    it('includes check-in/checkout unavailable note when checkin_time is null', () => {
      const property = makeFullProperty({ checkin_time: null })
      const result = buildPropertyContext(property)
      expect(result).toContain('Check-in/check-out times are not available for this property')
    })

    it('includes check-in/checkout unavailable note when checkout_time is null', () => {
      const property = makeFullProperty({ checkout_time: null })
      const result = buildPropertyContext(property)
      expect(result).toContain('Check-in/check-out times are not available for this property')
    })

    it('includes house rules unavailable note when house_rules is null', () => {
      const property = makeFullProperty({ house_rules: null })
      const result = buildPropertyContext(property)
      expect(result).toContain('House rules are not available for this property')
    })

    it('does not include unavailable notes when all fields are present', () => {
      const property = makeFullProperty()
      const result = buildPropertyContext(property)
      expect(result).not.toContain('Check-in/check-out times are not available')
      expect(result).not.toContain('House rules are not available')
    })
  })

  describe('propertyId handling', () => {
    it('does not crash when all fields are non-null', () => {
      const property = makeFullProperty()
      expect(() => buildPropertyContext(property)).not.toThrow()
    })

    it('does not crash with minimal property (most fields null)', () => {
      const property: PropertyRecord = {
        title: 'Test',
        description: null,
        address: null,
        lat: null,
        lng: null,
        price: null,
        category: null,
        space_type: null,
        guests: null,
        bedrooms: null,
        beds: null,
        bathrooms: null,
        amenities: null,
        cancellation_policy: null,
        checkin_time: null,
        checkout_time: null,
        house_rules: null,
      }
      expect(() => buildPropertyContext(property)).not.toThrow()
      const result = buildPropertyContext(property)
      expect(result).toContain('PROPERTY CONTEXT')
      expect(result).toContain('NEVER invent')
    })
  })

  describe('coordinate handling', () => {
    it('includes coordinates when both lat and lng are present', () => {
      const property = makeFullProperty({ lat: 41.8902, lng: 12.4922 })
      const result = buildPropertyContext(property)
      expect(result).toContain('41.8902')
      expect(result).toContain('12.4922')
    })

    it('omits coordinates when lat is null', () => {
      const property = makeFullProperty({ lat: null, lng: 12.4922 })
      const result = buildPropertyContext(property)
      expect(result).not.toContain('Coordinates')
    })

    it('omits coordinates when lng is null', () => {
      const property = makeFullProperty({ lat: 41.8902, lng: null })
      const result = buildPropertyContext(property)
      expect(result).not.toContain('Coordinates')
    })
  })
})
