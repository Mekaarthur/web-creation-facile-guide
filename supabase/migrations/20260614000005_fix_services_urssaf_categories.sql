-- FIX 0 — Services: add urssaf_eligible, unify category names
-- Segment A (≤30€/h, URSSAF eligible): Provider 75%, Bikawo 25%
-- Segment B (≥35€/h, no URSSAF):       Provider 73%, Bikawo 27%

-- 0a: Add urssaf_eligible column (default true = all eligible unless overridden)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS urssaf_eligible BOOLEAN NOT NULL DEFAULT true;

-- Mark Segment B services (≥35€/h) as not URSSAF eligible
UPDATE services
  SET urssaf_eligible = false
  WHERE price_per_hour >= 35;

-- 0b: Unify legacy category names to BIKA-branded equivalents
UPDATE services SET category = 'BIKA Animals' WHERE category = 'Animaux';
UPDATE services SET category = 'BIKA Maison'  WHERE category = 'Maison';
UPDATE services SET category = 'BIKA Seniors' WHERE category = 'Seniors';
UPDATE services SET category = 'BIKA Kids'    WHERE category = 'Enfants';

-- Bricolage gets its own Segment B category (must not be grouped with BIKA Maison)
UPDATE services
  SET category = 'BIKA Bricolage'
  WHERE name ILIKE '%bricolage%';
