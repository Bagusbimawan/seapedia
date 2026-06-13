package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/bagus/seapedia/internal/domain/delivery"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type deliveryRepository struct {
	db *gorm.DB
}

// NewDeliveryRepository returns a postgres-backed delivery.Repository.
func NewDeliveryRepository(db *gorm.DB) delivery.Repository {
	return &deliveryRepository{db: db}
}

func (r *deliveryRepository) Create(ctx context.Context, job *delivery.DeliveryJob) error {
	m := &DeliveryJobModel{
		ID:            job.ID,
		OrderID:       job.OrderID,
		DriverUserID:  job.DriverUserID,
		EarningAmount: job.EarningAmount,
		TakenAt:       job.TakenAt,
		CompletedAt:   job.CompletedAt,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *deliveryRepository) FindByID(ctx context.Context, id string) (*delivery.DeliveryJob, error) {
	var m DeliveryJobModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("delivery job not found")
		}
		return nil, err
	}
	return modelToDeliveryJob(&m), nil
}

func (r *deliveryRepository) FindByOrderID(ctx context.Context, orderID string) (*delivery.DeliveryJob, error) {
	var m DeliveryJobModel
	if err := r.db.WithContext(ctx).First(&m, "order_id = ?", orderID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("delivery job not found")
		}
		return nil, err
	}
	return modelToDeliveryJob(&m), nil
}

func (r *deliveryRepository) ListAvailable(ctx context.Context, page, limit int) ([]*delivery.DeliveryJob, int64, error) {
	var total int64
	var models []DeliveryJobModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&DeliveryJobModel{}).Where("driver_user_id IS NULL")
	q.Count(&total)
	if err := q.Order("created_at ASC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}
	return modelsToDeliveryJobs(models), total, nil
}

func (r *deliveryRepository) ListByDriver(ctx context.Context, driverID string, page, limit int) ([]*delivery.DeliveryJob, int64, error) {
	var total int64
	var models []DeliveryJobModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&DeliveryJobModel{}).Where("driver_user_id = ?", driverID)
	q.Count(&total)
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}
	return modelsToDeliveryJobs(models), total, nil
}

// TakeJob atomically assigns the driver using a single UPDATE, checking driver_user_id IS NULL.
func (r *deliveryRepository) TakeJob(ctx context.Context, jobID, driverID string) error {
	now := time.Now().UTC()
	result := r.db.WithContext(ctx).Exec(
		"UPDATE delivery_jobs SET driver_user_id = ?, taken_at = ? WHERE id = ? AND driver_user_id IS NULL",
		driverID, now, jobID,
	)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return apperror.Conflict("job already taken")
	}
	return nil
}

func (r *deliveryRepository) CompleteJob(ctx context.Context, jobID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&DeliveryJobModel{}).
		Where("id = ?", jobID).
		Update("completed_at", now).Error
}

func modelToDeliveryJob(m *DeliveryJobModel) *delivery.DeliveryJob {
	return &delivery.DeliveryJob{
		ID:            m.ID,
		OrderID:       m.OrderID,
		DriverUserID:  m.DriverUserID,
		EarningAmount: m.EarningAmount,
		TakenAt:       m.TakenAt,
		CompletedAt:   m.CompletedAt,
		CreatedAt:     m.CreatedAt,
	}
}

func modelsToDeliveryJobs(models []DeliveryJobModel) []*delivery.DeliveryJob {
	jobs := make([]*delivery.DeliveryJob, 0, len(models))
	for _, m := range models {
		mc := m
		jobs = append(jobs, modelToDeliveryJob(&mc))
	}
	return jobs
}
