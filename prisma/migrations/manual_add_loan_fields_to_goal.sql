-- Manual migration: Add loan fields to goals table
-- Run this SQL directly on your database when ready

-- Create LoanTerm enum
CREATE TYPE "LoanTerm" AS ENUM ('ONE_YEAR', 'THREE_YEARS', 'FIVE_YEARS', 'SEVEN_YEARS');

-- Add loanTerm column with enum type
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "loanTerm" "LoanTerm";

-- Add interestRate column
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "interestRate" DECIMAL(5,2);

-- Add minimumPayment column
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "minimumPayment" DECIMAL(12,2);

-- Optional: Add comments to document the columns
COMMENT ON COLUMN "goals"."loanTerm" IS 'Loan term: ONE_YEAR (1 year), THREE_YEARS (3 years), FIVE_YEARS (5 years), SEVEN_YEARS (7 years)';
COMMENT ON COLUMN "goals"."interestRate" IS 'Interest rate as a percentage (e.g., 5.25 for 5.25%)';
COMMENT ON COLUMN "goals"."minimumPayment" IS 'Minimum monthly payment amount';
