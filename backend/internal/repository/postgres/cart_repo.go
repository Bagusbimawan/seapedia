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
	type row struct {
		CartItemModel
		ProductName  string `gorm:"column:product_name"`
		ProductPrice int64  `gorm:"column:product_price"`
		ProductStock int    `gorm:"column:product_stock"`
		StoreID      string `gorm:"column:store_id"`
		StoreName    string `gorm:"column:store_name"`
	}

	var rows []row
	err := r.db.WithContext(ctx).
		Table("cart_items").
		Select(`cart_items.id, cart_items.cart_id, cart_items.product_id, cart_items.quantity,
			cart_items.created_at, cart_items.updated_at,
			products.name AS product_name, products.price AS product_price, products.stock AS product_stock,
			products.store_id AS store_id, stores.name AS store_name`).
		Joins("JOIN products ON products.id = cart_items.product_id").
		Joins("JOIN stores ON stores.id = products.store_id").
		Where("cart_items.cart_id = ?", cartID).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]*cart.CartItem, 0, len(rows))
	for _, row := range rows {
		mc := row.CartItemModel
		items = append(items, &cart.CartItem{
			ID:        mc.ID,
			CartID:    mc.CartID,
			ProductID: mc.ProductID,
			Quantity:  mc.Quantity,
			Product: &cart.ProductSnapshot{
				Name:      row.ProductName,
				Price:     row.ProductPrice,
				Stock:     row.ProductStock,
				StoreID:   row.StoreID,
				StoreName: row.StoreName,
			},
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
