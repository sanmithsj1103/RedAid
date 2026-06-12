-- Migration: Create all indexes for query optimisation
-- B-tree, PostGIS GIST, partial, and composite indexes.

-- ═══════════════════════════════
-- Standard B-Tree Indexes
-- ═══════════════════════════════

-- donors
CREATE INDEX idx_donors_blood_group   ON donors(blood_group);
CREATE INDEX idx_donors_availability  ON donors(availability);
CREATE INDEX idx_donors_last_donated  ON donors(last_donated_at);
CREATE INDEX idx_donors_trust_score   ON donors(trust_score DESC);
CREATE INDEX idx_donors_phone         ON donors(phone);

-- hospitals
CREATE INDEX idx_hospitals_city       ON hospitals(city);
CREATE INDEX idx_hospitals_verified   ON hospitals(is_verified);

-- blood_requests
CREATE INDEX idx_requests_hospital    ON blood_requests(hospital_id);
CREATE INDEX idx_requests_status      ON blood_requests(status);
CREATE INDEX idx_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX idx_requests_created     ON blood_requests(created_at DESC);
CREATE INDEX idx_requests_priority    ON blood_requests(priority);

-- donation_responses
CREATE INDEX idx_responses_request    ON donation_responses(request_id);
CREATE INDEX idx_responses_donor      ON donation_responses(donor_id);
CREATE INDEX idx_responses_status     ON donation_responses(status);

-- donation_history
CREATE INDEX idx_history_donor        ON donation_history(donor_id);
CREATE INDEX idx_history_donated_at   ON donation_history(donated_at DESC);
CREATE INDEX idx_history_hospital     ON donation_history(hospital_id);

-- audit_logs
CREATE INDEX idx_audit_actor          ON audit_logs(actor_id);
CREATE INDEX idx_audit_action         ON audit_logs(action);
CREATE INDEX idx_audit_created        ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity         ON audit_logs(entity_type, entity_id);

-- ═══════════════════════════════
-- PostGIS Spatial Indexes
-- ═══════════════════════════════

CREATE INDEX idx_donors_location      ON donors    USING GIST(location);
CREATE INDEX idx_hospitals_location   ON hospitals USING GIST(location);

-- ═══════════════════════════════
-- Partial (Filtered) Indexes
-- ═══════════════════════════════

-- Eligibility engine — only indexes donors that can be matched
CREATE INDEX idx_donors_eligible_partial
  ON donors(trust_score DESC, blood_group, last_donated_at)
  WHERE is_blacklisted = false
    AND availability = 'active';

-- Active requests only — hospital dashboard query
CREATE INDEX idx_requests_active_partial
  ON blood_requests(hospital_id, created_at DESC)
  WHERE status IN ('pending', 'dispatched', 'accepted', 'en_route', 'arrived');

-- Unverified hospitals — admin verification queue
CREATE INDEX idx_hospitals_pending_partial
  ON hospitals(created_at ASC)
  WHERE is_verified = false AND is_blacklisted = false;

-- ═══════════════════════════════
-- Composite Index for Eligibility Pre-filter
-- ═══════════════════════════════

CREATE INDEX idx_donors_eligibility_composite
  ON donors(blood_group, availability, last_donated_at, trust_score DESC)
  WHERE is_blacklisted = false;
