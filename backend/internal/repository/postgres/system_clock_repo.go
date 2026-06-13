package postgres

import (
	"context"
	"time"

	"gorm.io/gorm"
)

// SystemClockRepository manages the virtual clock offset stored in DB.
type SystemClockRepository struct {
	db *gorm.DB
}

// NewSystemClockRepository returns a new SystemClockRepository.
func NewSystemClockRepository(db *gorm.DB) *SystemClockRepository {
	return &SystemClockRepository{db: db}
}

// GetOffsetHours returns the current offset in hours.
func (r *SystemClockRepository) GetOffsetHours(ctx context.Context) (int64, error) {
	var m SystemClockModel
	if err := r.db.WithContext(ctx).First(&m, "id = 1").Error; err != nil {
		return 0, err
	}
	return m.OffsetHours, nil
}

// AdvanceDay adds 24 hours to the offset and returns the new offset.
func (r *SystemClockRepository) AdvanceDay(ctx context.Context) (int64, error) {
	var m SystemClockModel
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&m, "id = 1").Error; err != nil {
			return err
		}
		m.OffsetHours += 24
		m.UpdatedAt = time.Now().UTC()
		return tx.Save(&m).Error
	})
	if err != nil {
		return 0, err
	}
	return m.OffsetHours, nil
}
