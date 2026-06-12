-- Migration: Enable Row-Level Security and create all policies
-- RLS is enabled on every table. service_role bypasses all policies.

-- Enable RLS on all tables
ALTER TABLE donors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_surplus   ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────
-- donors
-- ─────────────────────────────
CREATE POLICY donors_select_own ON donors
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY donors_update_own ON donors
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- ─────────────────────────────
-- hospitals
-- ─────────────────────────────
CREATE POLICY hospitals_select_own ON hospitals
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY hospitals_update_own ON hospitals
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- ─────────────────────────────
-- blood_requests
-- ─────────────────────────────
CREATE POLICY requests_hospital_own ON blood_requests
  FOR ALL USING (
    hospital_id = (
      SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- donation_responses
-- ─────────────────────────────
CREATE POLICY responses_donor_select ON donation_responses
  FOR SELECT USING (
    donor_id = (
      SELECT id FROM donors WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY responses_hospital_select ON donation_responses
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM blood_requests
      WHERE hospital_id = (
        SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────
-- donation_history (INSERT only — immutable)
-- ─────────────────────────────
CREATE POLICY history_donor_select ON donation_history
  FOR SELECT USING (
    donor_id = (
      SELECT id FROM donors WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- blood_inventory
-- ─────────────────────────────
CREATE POLICY inventory_hospital_own ON blood_inventory
  FOR ALL USING (
    hospital_id = (
      SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- hospital_surplus
-- ─────────────────────────────
CREATE POLICY surplus_verified_hospitals_select ON hospital_surplus
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE auth_user_id = auth.uid() AND is_verified = true
    )
  );

CREATE POLICY surplus_hospital_own_write ON hospital_surplus
  FOR INSERT WITH CHECK (
    hospital_id = (
      SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- donor_badges
-- ─────────────────────────────
CREATE POLICY badges_donor_select ON donor_badges
  FOR SELECT USING (
    donor_id = (
      SELECT id FROM donors WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- audit_logs (INSERT only — immutable, server-side only)
-- No permissive SELECT policies for non-service roles
-- ─────────────────────────────
