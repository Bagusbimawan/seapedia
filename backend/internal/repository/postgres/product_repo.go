package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/product"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type productRepository struct {
	db *gorm.DB
}

// NewProductRepository returns a postgres-backed product.Repository.
func NewProductRepository(db *gorm.DB) product.Repository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, p *product.Product) error {
	m := productToModel(p)
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *productRepository) FindByID(ctx context.Context, id string) (*product.Product, error) {
	var m ProductModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("product not found")
		}
		return nil, err
	}
	return modelToProduct(&m), nil
}

func (r *productRepository) ListByStore(ctx context.Context, storeID string, page, limit int) ([]*product.Product, int64, error) {
	var total int64
	var models []ProductModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&ProductModel{}).Where("store_id = ?", storeID)
	q.Count(&total)
	if err := q.Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}
	return modelsToProducts(models), total, nil
}

func (r *productRepository) ListAll(ctx context.Context, search string, page, limit int) ([]*product.Product, int64, error) {
	var total int64
	offset := (page - 1) * limit

	type productRow struct {
		ProductModel
		StoreName string `gorm:"column:store_name"`
	}

	countQ := r.db.WithContext(ctx).Model(&ProductModel{})
	if search != "" {
		countQ = countQ.Where("products.name ILIKE ?", "%"+search+"%")
	}
	if err := countQ.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	q := r.db.WithContext(ctx).
		Table("products").
		Select("products.*, stores.name AS store_name").
		Joins("JOIN stores ON stores.id = products.store_id")
	if search != "" {
		q = q.Where("products.name ILIKE ?", "%"+search+"%")
	}

	var rows []productRow
	if err := q.Offset(offset).Limit(limit).Order("products.created_at DESC").Find(&rows).Error; err != nil {
		return nil, 0, err
	}

	products := make([]*product.Product, 0, len(rows))
	for _, row := range rows {
		p := modelToProduct(&row.ProductModel)
		p.StoreName = row.StoreName
		products = append(products, p)
	}
	return products, total, nil
}

func (r *productRepository) Update(ctx context.Context, p *product.Product) error {
	return r.db.WithContext(ctx).Model(&ProductModel{}).
		Where("id = ?", p.ID).
		Updates(map[string]interface{}{
			"name":        p.Name,
			"description": p.Description,
			"price":       p.Price,
			"stock":       p.Stock,
		}).Error
}

func (r *productRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&ProductModel{}, "id = ?", id).Error
}

// DecrementStock implements ADR-007 atomic stock decrement.
func (r *productRepository) DecrementStock(ctx context.Context, id string, qty int) error {
	result := r.db.WithContext(ctx).Exec(
		"UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
		qty, id, qty,
	)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return apperror.BadRequest("insufficient stock for product " + id)
	}
	return nil
}

// RestoreStock increments stock (used for order reversals).
func (r *productRepository) RestoreStock(ctx context.Context, id string, qty int) error {
	return r.db.WithContext(ctx).Exec(
		"UPDATE products SET stock = stock + ? WHERE id = ?",
		qty, id,
	).Error
}

func productToModel(p *product.Product) *ProductModel {
	return &ProductModel{
		ID:          p.ID,
		StoreID:     p.StoreID,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		Stock:       p.Stock,
	}
}

func modelToProduct(m *ProductModel) *product.Product {
	return &product.Product{
		ID:          m.ID,
		StoreID:     m.StoreID,
		Name:        m.Name,
		Description: m.Description,
		Price:       m.Price,
		Stock:       m.Stock,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}

func modelsToProducts(models []ProductModel) []*product.Product {
	products := make([]*product.Product, 0, len(models))
	for _, m := range models {
		mc := m
		products = append(products, modelToProduct(&mc))
	}
	return products
}
