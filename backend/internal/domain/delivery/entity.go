package delivery

import "time"

// DeliveryJob represents a shipping task that drivers can claim.
type DeliveryJob struct {
	ID            string
	OrderID       string
	DriverUserID  *string
	EarningAmount int64
	StoreName     string // populated when listing available jobs
	TakenAt       *time.Time
	CompletedAt   *time.Time
	CreatedAt     time.Time
}
