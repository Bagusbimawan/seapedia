ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS provisioned_by VARCHAR(20) NOT NULL DEFAULT 'seller',
    ADD COLUMN IF NOT EXISTS demo_password VARCHAR(100);

UPDATE stores SET provisioned_by = 'seed' WHERE provisioned_by = 'seller';
