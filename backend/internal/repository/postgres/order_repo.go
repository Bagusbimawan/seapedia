package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/pkg/apperror"
	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

// NewOrderRepository returns a postgres-backed order.Repository.
func NewOrderRepository(db *gorm.DB) order.Repository {
	return &orderRepository{db: db}
}

func (r *orderRepository) Create(ctx context.Context, o *order.Order) error {
	m := orderToModel(o)
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return err
		}
		for _, item := range o.Items {
			im := &OrderItemModel{
				ID:            item.ID,
				OrderID:       o.ID,
				ProductID:     item.ProductID,
				NameSnapshot:  item.NameSnapshot,
				PriceSnapshot: item.PriceSnapshot,
				Quantity:      item.Quantity,
			}
			if err := tx.Create(im).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *orderRepository) FindByID(ctx context.Context, id string) (*order.Order, error) {
	var m OrderModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("order not found")
		}
		return nil, err
	}
	o := modelToOrder(&m)
	var items []OrderItemModel
	if err := r.db.WithContext(ctx).Where("order_id = ?", id).Find(&items).Error; err != nil {
		return nil, err
	}
	for _, item := range items {
		ic := item
		o.Items = append(o.Items, &order.OrderItem{
			ID:            ic.ID,
			OrderID:       ic.OrderID,
			ProductID:     ic.ProductID,
			NameSnapshot:  ic.NameSnapshot,
			PriceSnapshot: ic.PriceSnapshot,
			Quantity:      ic.Quantity,
		})
	}
	return o, nil
}

func (r *orderRepository) ListByBuyer(ctx context.Context, buyerID string, page, limit int) ([]*order.Order, int64, error) {
	return r.listOrders(ctx, "buyer_user_id = ?", buyerID, nil, page, limit)
}

func (r *orderRepository) ListByStore(ctx context.Context, storeID string, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	return r.listOrders(ctx, "store_id = ?", storeID, status, page, limit)
}

func (r *orderRepository) ListAll(ctx context.Context, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	return r.listOrders(ctx, "", "", status, page, limit)
}

func (r *orderRepository) listOrders(ctx context.Context, whereClause, whereArg string, status *order.Status, page, limit int) ([]*order.Order, int64, error) {
	var total int64
	var models []OrderModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&OrderModel{})
	if whereClause != "" {
		q = q.Where(whereClause, whereArg)
	}
	if status != nil {
		q = q.Where("status = ?", string(*status))
	}
	q.Count(&total)
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	orders := make([]*order.Order, 0, len(models))
	for _, m := range models {
		mc := m
		orders = append(orders, modelToOrder(&mc))
	}
	return orders, total, nil
}

func (r *orderRepository) UpdateStatus(ctx context.Context, orderID string, status order.Status) error {
	return r.db.WithContext(ctx).Model(&OrderModel{}).Where("id = ?", orderID).
		Update("status", string(status)).Error
}

func (r *orderRepository) AddStatusHistory(ctx context.Context, orderID string, status order.Status) error {
	m := &OrderStatusHistoryModel{
		ID:      newUUID(),
		OrderID: orderID,
		Status:  string(status),
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *orderRepository) FindOverdue(ctx context.Context, now time.Time) ([]*order.Order, error) {
	var models []OrderModel
	err := r.db.WithContext(ctx).
		Where("status NOT IN ? AND deadline_at < ?",
			[]string{string(order.StatusPesananSelesai), string(order.StatusDikembalikan)},
			now,
		).Find(&models).Error
	if err != nil {
		return nil, err
	}
	orders := make([]*order.Order, 0, len(models))
	for _, m := range models {
		mc := m
		orders = append(orders, modelToOrder(&mc))
	}
	return orders, nil
}

func (r *orderRepository) FindIncomeByOrder(ctx context.Context, orderID string) (int64, error) {
	var income SellerIncomeModel
	err := r.db.WithContext(ctx).
		Where("order_id = ? AND type = 'INCOME'", orderID).
		Order("created_at DESC").
		First(&income).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil
		}
		return 0, err
	}
	return income.Amount, nil
}

// ── SellerIncomeRepository ────────────────────────────────────────────────────

type sellerIncomeRepository struct {
	db *gorm.DB
}

// NewSellerIncomeRepository returns a postgres-backed order.SellerIncomeRepository.
func NewSellerIncomeRepository(db *gorm.DB) order.SellerIncomeRepository {
	return &sellerIncomeRepository{db: db}
}

func (r *sellerIncomeRepository) Insert(ctx context.Context, storeID, orderID, incomeType string, amount int64) error {
	m := &SellerIncomeModel{
		ID:      newUUID(),
		StoreID: storeID,
		OrderID: orderID,
		Type:    incomeType,
		Amount:  amount,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *sellerIncomeRepository) ListByStore(ctx context.Context, storeID string, page, limit int) ([]order.SellerIncome, int64, error) {
	var total int64
	var models []SellerIncomeModel
	offset := (page - 1) * limit

	q := r.db.WithContext(ctx).Model(&SellerIncomeModel{}).Where("store_id = ?", storeID)
	q.Count(&total)
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	incomes := make([]order.SellerIncome, 0, len(models))
	for _, m := range models {
		incomes = append(incomes, order.SellerIncome{
			ID:        m.ID,
			StoreID:   m.StoreID,
			OrderID:   m.OrderID,
			Type:      m.Type,
			Amount:    m.Amount,
			CreatedAt: m.CreatedAt,
		})
	}
	return incomes, total, nil
}

// ── Helpers ────────────────────────────────────────────────────────────────────

func orderToModel(o *order.Order) *OrderModel {
	return &OrderModel{
		ID:          o.ID,
		BuyerUserID: o.BuyerUserID,
		StoreID:     o.StoreID,
		DiscountID:  o.DiscountID,
		AddressSnapshot: AddressSnapshotJSON{
			Label:   o.AddressSnapshot.Label,
			Street:  o.AddressSnapshot.Street,
			City:    o.AddressSnapshot.City,
			ZipCode: o.AddressSnapshot.ZipCode,
		},
		DeliveryMethod: string(o.DeliveryMethod),
		Subtotal:       o.Subtotal,
		DiscountAmount: o.DiscountAmount,
		TaxAmount:      o.TaxAmount,
		DeliveryFee:    o.DeliveryFee,
		Total:          o.Total,
		Status:         string(o.Status),
		DeadlineAt:     o.DeadlineAt,
	}
}

func modelToOrder(m *OrderModel) *order.Order {
	return &order.Order{
		ID:          m.ID,
		BuyerUserID: m.BuyerUserID,
		StoreID:     m.StoreID,
		DiscountID:  m.DiscountID,
		AddressSnapshot: order.AddressSnapshot{
			Label:   m.AddressSnapshot.Label,
			Street:  m.AddressSnapshot.Street,
			City:    m.AddressSnapshot.City,
			ZipCode: m.AddressSnapshot.ZipCode,
		},
		DeliveryMethod: order.DeliveryMethod(m.DeliveryMethod),
		Subtotal:       m.Subtotal,
		DiscountAmount: m.DiscountAmount,
		TaxAmount:      m.TaxAmount,
		DeliveryFee:    m.DeliveryFee,
		Total:          m.Total,
		Status:         order.Status(m.Status),
		DeadlineAt:     m.DeadlineAt,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}
