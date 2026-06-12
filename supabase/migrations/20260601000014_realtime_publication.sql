-- Migration: Enable Supabase Realtime on tables that drive live UI updates

ALTER PUBLICATION supabase_realtime ADD TABLE donation_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE blood_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE hospital_surplus;
