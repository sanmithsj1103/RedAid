-- Migration: Add is_suspended column to donors and update find_eligible_donors
-- Phase 7 Implementation

ALTER TABLE donors ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Add index on is_suspended to optimize query and eligibility checks
CREATE INDEX idx_donors_suspended ON donors(is_suspended);

-- Re-create find_eligible_donors with is_suspended check
CREATE OR REPLACE FUNCTION find_eligible_donors(
  req_id UUID,
  hosp_id UUID,
  comp_groups TEXT[],
  radius_km FLOAT
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(100),
  fcm_token TEXT,
  trust_score NUMERIC,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.full_name, d.fcm_token, d.trust_score,
         ST_Distance(d.location, h.location) / 1000.0 AS distance_km
  FROM donors d
  JOIN hospitals h ON h.id = hosp_id
  WHERE d.blood_group::text = ANY(comp_groups)
    AND date_part('year', age(d.date_of_birth)) BETWEEN 18 AND 65
    AND (d.last_donated_at IS NULL OR d.last_donated_at < now() - INTERVAL '90 days')
    AND d.availability = 'active'
    AND (d.snooze_until IS NULL OR d.snooze_until < now())
    AND d.is_blacklisted = FALSE
    AND d.is_suspended = FALSE
    AND ST_DWithin(d.location, h.location, radius_km * 1000)
    AND d.id NOT IN (
      SELECT donor_id FROM donation_responses WHERE request_id = req_id
    )
  ORDER BY d.trust_score DESC, distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
