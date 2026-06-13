package postgres

import (
	"context"
	"errors"

	"github.com/bagus/seapedia/internal/domain/cart"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type cartRepository struct {
	db *gorm.DB
}

// NewCartRepository returns a postgres-backed cart.Repository.
func NewCartRepository(db *gorm.DB) cart.Repository {
	return &cartRepository{db: db}
}

func (r *cartRepository) FindByUserID(ctx context.Context, userID string) (*cart.Cart, error) {
	var m CartModel
	if err := r.db.WithContext(ctx).First(&m, "user_id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("cart not found")
		}
		return nil, err
	}
	c := modelToCart(&m)
	items, err := r.GetItemsWithProducts(ctx, m.ID)
	if err != nil {
		return nil, err
	}
	c.Items = items
	return c, nil
}

func (r *cartRepository) CreateCart(ctx context.Context, c *cart.Cart) error {
	m := &CartModel{
		ID:      c.ID,
		UserID:  c.UserID,
		StoreID: c.StoreID,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

// AddItem upserts a cart item. If the item already exists, it increments quantity.
func (r *cartRepository) AddItem(ctx context.Context, cartID, productID string, qty int) error {
	item := CartItemModel{
		ID:        newUUID(),
		CartID:    cartID,
		ProductID: productID,
		Quantity:  qty,
	}
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "cart_id"}, {Name: "product_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"quantity": gorm.Expr("cart_items.quantity + ?", qty)}),
		}).
		Create(&item).Error
}

func (r *cartRepository) UpdateItem(ctx context.Context, cartID, productID string, qty int) error {
	return r.db.WithContext(ctx).Model(&CartItemModel{}).
		Where("cart_id = ? AND product_id = ?", cartID, productID).
		Update("quantity", qty).Error
}

func (r *cartRepository) RemoveItem(ctx context.Context, cartID, productID string) error {
	return r.db.WithContext(ctx).Delete(&CartItemModel{}, "cart_id = ? AND product_id = ?", cartID, productID).Error
}

func (r *cartRepository) ClearCart(ctx context.Context, cartID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&CartItemModel{}, "cart_id = ?", cartID).Error; err != nil {
			return err
		}
		return tx.Model(&CartModel{}).Where("id = ?", cartID).Update("store_id", nil).Error
	})
}

func (r *cartRepository) UpdateStoreID(ctx context.Context, cartID string, storeID *string) error {
	return r.db.WithContext(ctx).Model(&CartModel{}).Where("id = ?", cartID).
		Update("store_id", storeID).Error
}

func (r *cartRepository) GetItemsWithProducts(ctx context.Context, cartID string) ([]*cart.CartItem, error) {
	var models []CartItemModel
	if err := r.db.WithContext(ctx).Where("cart_id = ?", cartID).Find(&models).Error; err != nil {
		return nil, err
	}
	items := make([]*cart.CartItem, 0, len(models))
	for _, m := range models {
		mc := m
		items = append(items, &cart.CartItem{
			ID:        mc.ID,
			CartID:    mc.CartID,
			ProductID: mc.ProductID,
			Quantity:  mc.Quantity,
			CreatedAt: mc.CreatedAt,
			UpdatedAt: mc.UpdatedAt,
		})
	}
	return items, nil
}

func modelToCart(m *CartModel) *cart.Cart {
	return &cart.Cart{
		ID:        m.ID,
		UserID:    m.UserID,
		StoreID:   m.StoreID,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}
