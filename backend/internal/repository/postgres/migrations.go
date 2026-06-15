package postgres

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// RunPendingMigrations applies schema upgrades on startup (safe, idempotent).
func RunPendingMigrations(db *gorm.DB) error {
	return apply002(db)
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
	}
	for _, stmt := range statements {
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("migration 002 failed: %w", err)
		}
	}
	log.Println("migration 002_store_provision applied")
	return nil
}
