package postgres

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// RunPendingMigrations applies SQL migrations that are safe to run on startup.
func RunPendingMigrations(db *gorm.DB) error {
	if err := apply002(db); err != nil {
		return err
	}
	return applyDataFixes(db)
}

func apply002(db *gorm.DB) error {
	var count int64
	if err := db.Raw(`
		SELECT COUNT(*) FROM information_schema.columns
		WHERE table_name = 'stores' AND column_name = 'provisioned_by'
	`).Scan(&count).Error; err != nil {
		return fmt.Errorf("check migration 002: %w", err)
	}
	if count > 0 {
		return nil
	}

	log.Println("applying migration 002_store_provision...")
	statements := []string{
		`ALTER TABLE stores ADD COLUMN IF NOT EXISTS provisioned_by VARCHAR(20) NOT NULL DEFAULT 'seller'`,
		`ALTER TABLE stores ADD COLUMN IF NOT EXISTS demo_password VARCHAR(100)`,
		`UPDATE stores SET provisioned_by = 'seed' WHERE provisioned_by = 'seller'`,
	}
	for _, stmt := range statements {
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("migration 002 failed: %w", err)
		}
	}
	log.Println("migration 002_store_provision applied")
	return nil
}

func applyDataFixes(db *gorm.DB) error {
	log.Println("applying demo store data fixes...")

	fixes := []string{
		// Hapus toko multi-role lama
		`DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE name = 'Toko Multi')`,
		`DELETE FROM stores WHERE name = 'Toko Multi'`,
		// Seed seller@ muncul di panel login demo
		`UPDATE stores s SET provisioned_by = 'seed', demo_password = 'seller123'
		 FROM users u
		 WHERE s.seller_user_id = u.id AND u.email = 'seller@seapedia.com'`,
	}
	for _, stmt := range fixes {
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("data fix failed: %w", err)
		}
	}
	return nil
}
