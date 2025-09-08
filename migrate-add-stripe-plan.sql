-- Migration to add stripe_plan column to users table
ALTER TABLE users ADD COLUMN stripe_plan TEXT;