package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type storeRepository struct {
	db *gorm.DB
}

// NewStoreRepository returns a postgres-backed store.Repository.
func NewStoreRepository(db *gorm.DB) store.Repository {
	return &storeRepository{db: db}
}

func (r *storeRepository) Create(ctx context.Context, s *store.Store) error {
	m := storeToModel(s)
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *storeRepository) FindByID(ctx context.Context, id string) (*store.Store, error) {
	var m StoreModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("store not found")
		}
		return nil, err
	}
	return modelToStore(&m), nil
}

func (r *storeRepository) FindBySellerID(ctx context.Context, sellerID string) (*store.Store, error) {
	var m StoreModel
	if err := r.db.WithContext(ctx).First(&m, "seller_user_id = ?", sellerID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("store not found")
		}
		return nil, err
	}
	return modelToStore(&m), nil
}

func (r *storeRepository) Update(ctx context.Context, s *store.Store) error {
	return r.db.WithContext(ctx).Model(&StoreModel{}).
		Where("id = ?", s.ID).
		Updates(map[string]interface{}{
			"name":        s.Name,
			"description": s.Description,
		}).Error
}

func (r *storeRepository) ListAll(ctx context.Context, page, limit int) ([]*store.Store, int64, error) {
	var total int64
	var models []StoreModel
	offset := (page - 1) * limit

	r.db.WithContext(ctx).Model(&StoreModel{}).Count(&total)
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	stores := make([]*store.Store, 0, len(models))
	for _, m := range models {
		mc := m
		stores = append(stores, modelToStore(&mc))
	}
	return stores, total, nil
}

func (r *storeRepository) ListByProvisionedBy(ctx context.Context, provisionedBy string, page, limit int) ([]*store.Store, int64, error) {
	var total int64
	var models []StoreModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&StoreModel{}).Where("provisioned_by = ?", provisionedBy)
	q.Count(&total)
	if err := q.Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	stores := make([]*store.Store, 0, len(models))
	for _, m := range models {
		mc := m
		stores = append(stores, modelToStore(&mc))
	}
	return stores, total, nil
}

func (r *storeRepository) ListForDemoPanel(ctx context.Context, page, limit int) ([]*store.Store, int64, error) {
	var total int64
	var models []StoreModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&StoreModel{}).
		Where("provisioned_by IN ?", []string{store.ProvisionedAdmin, store.ProvisionedSeed})
	q.Count(&total)
	if err := q.Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	stores := make([]*store.Store, 0, len(models))
	for _, m := range models {
		mc := m
		stores = append(stores, modelToStore(&mc))
	}
	return stores, total, nil
}

func storeToModel(s *store.Store) *StoreModel {
	return &StoreModel{
		ID:            s.ID,
		SellerUserID:  s.SellerUserID,
		Name:          s.Name,
		Description:   s.Description,
		ProvisionedBy: s.ProvisionedBy,
		DemoPassword:  s.DemoPassword,
	}
}

func modelToStore(m *StoreModel) *store.Store {
	return &store.Store{
		ID:            m.ID,
		SellerUserID:  m.SellerUserID,
		Name:          m.Name,
		Description:   m.Description,
		ProvisionedBy: m.ProvisionedBy,
		DemoPassword:  m.DemoPassword,
		CreatedAt:     m.CreatedAt,
		UpdatedAt:     m.UpdatedAt,
	}
}
