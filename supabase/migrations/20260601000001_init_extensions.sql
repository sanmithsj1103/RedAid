-- Migration: Enable required PostgreSQL extensions
-- RedAid requires PostGIS for location-based matching and uuid-ossp for UUID generation.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
