ALTER TABLE stores
    DROP COLUMN IF EXISTS demo_password,
    DROP COLUMN IF EXISTS provisioned_by;
