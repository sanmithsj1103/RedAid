-- Migration: Create blood_inventory table
-- Stock levels per blood group per hospital. 8 rows per hospital.

CREATE TABLE blood_inventory (
  -- Identity
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id           UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Inventory
  blood_group           TEXT        NOT NULL
                        CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available       INT         NOT NULL DEFAULT 0
                        CHECK (units_available >= 0),
  low_stock_threshold   INT         NOT NULL DEFAULT 2
                        CHECK (low_stock_threshold >= 0),

  -- Timestamps
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per blood group per hospital
  UNIQUE (hospital_id, blood_group)
);
