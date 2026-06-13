package order

import "time"

// Status represents the order lifecycle state.
type Status string

const (
	StatusSedangDikemas    Status = "SEDANG_DIKEMAS"
	StatusMenungguPengirim Status = "MENUNGGU_PENGIRIM"
	StatusSedangDikirim    Status = "SEDANG_DIKIRIM"
	StatusPesananSelesai   Status = "PESANAN_SELESAI"
	StatusDikembalikan     Status = "DIKEMBALIKAN"
)

// IsTerminal returns true if no further transitions are allowed.
func (s Status) IsTerminal() bool {
	return s == StatusPesananSelesai || s == StatusDikembalikan
}

// CanTransitionTo validates allowed state transitions.
func (s Status) CanTransitionTo(next Status) bool {
	transitions := map[Status][]Status{
		StatusSedangDikemas:    {StatusMenungguPengirim, StatusDikembalikan},
		StatusMenungguPengirim: {StatusSedangDikirim, StatusDikembalikan},
		StatusSedangDikirim:    {StatusPesananSelesai, StatusDikembalikan},
	}
	allowed, ok := transitions[s]
	if !ok {
		return false
	}
	for _, a := range allowed {
		if a == next {
			return true
		}
	}
	return false
}

// DeliveryMethod represents supported shipping options.
type DeliveryMethod string

const (
	MethodInstant DeliveryMethod = "INSTANT"
	MethodNextDay DeliveryMethod = "NEXT_DAY"
	MethodRegular DeliveryMethod = "REGULAR"
)

// Fee returns the fixed delivery fee in Rupiah for this method.
func (m DeliveryMethod) Fee() int64 {
	switch m {
	case MethodInstant:
		return 25000
	case MethodNextDay:
		return 15000
	case MethodRegular:
		return 10000
	default:
		return 0
	}
}

// DeadlineDays returns the SLA days until the order is considered overdue.
func (m DeliveryMethod) DeadlineDays() int {
	switch m {
	case MethodInstant:
		return 1
	case MethodNextDay:
		return 2
	case MethodRegular:
		return 5
	default:
		return 5
	}
}

// AddressSnapshot stores an immutable copy of the delivery address at order time.
type AddressSnapshot struct {
	Label   string `json:"label"`
	Street  string `json:"street"`
	City    string `json:"city"`
	ZipCode string `json:"zip_code"`
}

// Order is the core order domain entity.
type Order struct {
	ID              string
	BuyerUserID     string
	StoreID         string
	DiscountID      *string
	AddressSnapshot AddressSnapshot
	DeliveryMethod  DeliveryMethod
	Subtotal        int64
	DiscountAmount  int64
	TaxAmount       int64
	DeliveryFee     int64
	Total           int64
	Status          Status
	DeadlineAt      time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Items           []*OrderItem
}

// OrderItem is a snapshot of a product at order creation time.
type OrderItem struct {
	ID            string
	OrderID       string
	ProductID     string
	NameSnapshot  string
	PriceSnapshot int64
	Quantity      int
}

// StatusHistory records every status change for an order.
type StatusHistory struct {
	ID        string
	OrderID   string
	Status    Status
	CreatedAt time.Time
}

// SellerIncome tracks earnings and reversals for a store.
type SellerIncome struct {
	ID        string
	StoreID   string
	OrderID   string
	Type      string // "INCOME" or "REVERSAL"
	Amount    int64
	CreatedAt time.Time
}
