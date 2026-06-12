-- Migration: Create complete_donation_transaction function
-- Runs all database updates for a completed donation atomically.

CREATE OR REPLACE FUNCTION complete_donation_transaction(p_response_id UUID)
RETURNS TABLE (
  history_id UUID,
  donor_id UUID,
  total_donations INT,
  total_responses INT,
  total_accepted INT
) AS $$
DECLARE
  v_donor_id UUID;
  v_request_id UUID;
  v_hospital_id UUID;
  v_blood_group TEXT;
  v_history_id UUID;
  v_total_donations INT;
  v_total_responses INT;
  v_total_accepted INT;
  v_status TEXT;
  v_units_fulfilled INT;
  v_units_required INT;
BEGIN
  -- 1. Fetch response and request details
  SELECT r.donor_id, r.request_id, r.status, d.blood_group, req.hospital_id, req.units_fulfilled, req.units_required
  INTO v_donor_id, v_request_id, v_status, v_blood_group, v_hospital_id, v_units_fulfilled, v_units_required
  FROM donation_responses r
  JOIN donors d ON d.id = r.donor_id
  JOIN blood_requests req ON req.id = r.request_id
  WHERE r.id = p_response_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Response not found';
  END IF;

  IF v_status NOT IN ('accepted', 'en_route', 'arrived') THEN
    RAISE EXCEPTION 'Invalid response status';
  END IF;

  -- 2. Update donation_responses status
  UPDATE donation_responses
  SET status = 'donated', donated_at = now()
  WHERE id = p_response_id;

  -- 3. Update donors table (increment total_donations)
  UPDATE donors
  SET last_donated_at = now(),
      total_donations = total_donations + 1
  WHERE id = v_donor_id
  RETURNING donors.total_donations, donors.total_responses, donors.total_accepted
  INTO v_total_donations, v_total_responses, v_total_accepted;

  -- 4. Insert into donation_history
  INSERT INTO donation_history (donor_id, hospital_id, request_id, blood_group, donated_at)
  VALUES (v_donor_id, v_hospital_id, v_request_id, v_blood_group, now())
  RETURNING id INTO v_history_id;

  -- 5. Update blood_requests fulfilled count and status
  v_units_fulfilled := v_units_fulfilled + 1;
  UPDATE blood_requests
  SET units_fulfilled = v_units_fulfilled,
      status = CASE WHEN v_units_fulfilled >= v_units_required THEN 'completed' ELSE status END
  WHERE id = v_request_id;

  RETURN QUERY SELECT v_history_id, v_donor_id, v_total_donations, v_total_responses, v_total_accepted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
