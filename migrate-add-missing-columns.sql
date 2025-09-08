-- Migration to add missing columns to users table
ALTER TABLE users ADD COLUMN current_period_end DATETIME;
ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;