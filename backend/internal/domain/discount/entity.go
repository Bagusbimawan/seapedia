package discount

import "time"

// Kind distinguishes between single-use vouchers and date-bound promotions.
type Kind string

const (
	KindVoucher Kind = "VOUCHER"
	KindPromo   Kind = "PROMO"
)

// DiscountType determines how the discount value is applied.
type DiscountType string

const (
	TypePercent DiscountType = "PERCENT"
	TypeFixed   DiscountType = "FIXED"
)

// Discount represents a promotional code or voucher.
type Discount struct {
	ID             string
	Code           string
	Kind           Kind
	DiscountType   DiscountType
	DiscountValue  int64
	ExpiryDate     time.Time
	RemainingUsage *int
	CreatedAt      time.Time
}

// IsUsable returns true if the discount can still be applied at the given time.
func (d *Discount) IsUsable(now time.Time) bool {
	if now.After(d.ExpiryDate) {
		return false
	}
	// Vouchers additionally require remaining usage > 0.
	if d.Kind == KindVoucher {
		if d.RemainingUsage == nil || *d.RemainingUsage <= 0 {
			return false
		}
	}
	return true
}

// Calculate returns the discount amount (in Rupiah) for the given subtotal.
// For PERCENT discounts the result is capped at the subtotal.
func (d *Discount) Calculate(subtotal int64) int64 {
	switch d.DiscountType {
	case TypePercent:
		amount := subtotal * d.DiscountValue / 100
		if amount > subtotal {
			return subtotal
		}
		return amount
	case TypeFixed:
		if d.DiscountValue > subtotal {
			return subtotal
		}
		return d.DiscountValue
	default:
		return 0
	}
}
