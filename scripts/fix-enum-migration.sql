-- Run this before prisma db push to fix existing data
-- Usage: psql "postgresql://postgres:vteating_dev@localhost:5433/vteating" -f scripts/fix-enum-migration.sql

-- Update Fulfillment: map old statuses to CLAIMED
UPDATE "Fulfillment" SET status = 'CLAIMED' WHERE status IN ('PICKED_UP', 'DELIVERED');

-- Update MealRequest: map DELIVERED to PAID (buyer had paid, was awaiting confirm)
UPDATE "MealRequest" SET status = 'PAID' WHERE status = 'DELIVERED';
