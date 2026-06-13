package clock

import (
	"sync/atomic"
	"time"
)

// offsetHours is an atomically-managed offset applied to the current time.
var offsetHours int64

// Now returns the virtual current time (real time + offsetHours).
func Now() time.Time {
	h := atomic.LoadInt64(&offsetHours)
	return time.Now().UTC().Add(time.Duration(h) * time.Hour)
}

// SetOffset sets the virtual clock offset in hours.
func SetOffset(hours int64) {
	atomic.StoreInt64(&offsetHours, hours)
}

// GetOffset returns the current offset in hours.
func GetOffset() int64 {
	return atomic.LoadInt64(&offsetHours)
}
