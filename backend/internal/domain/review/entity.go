package review

import "time"

// AppReview is a user-submitted review of the SEAPEDIA platform.
type AppReview struct {
	ID           string
	ReviewerName string
	Rating       int
	Comment      string
	UserID       *string
	CreatedAt    time.Time
}
