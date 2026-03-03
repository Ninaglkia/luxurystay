-- Migration: add FAQ-required columns to properties table
-- Phase 04 — Property FAQ Integration
-- checkin_time and checkout_time store time-of-day as text (e.g. "15:00")
-- house_rules stores free-text rules specific to the property
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS checkin_time TEXT,
  ADD COLUMN IF NOT EXISTS checkout_time TEXT,
  ADD COLUMN IF NOT EXISTS house_rules TEXT;
