-- AlterEnum - Add ROLLOVER to TransactionType if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'TransactionType' AND e.enumlabel = 'ROLLOVER'
    ) THEN
        ALTER TYPE "TransactionType" ADD VALUE 'ROLLOVER';
    END IF;
END $$;
