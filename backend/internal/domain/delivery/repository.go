package delivery

import "context"

// Repository defines the persistence interface for the DeliveryJob domain.
type Repository interface {
	Create(ctx context.Context, job *DeliveryJob) error
	FindByID(ctx context.Context, id string) (*DeliveryJob, error)
	FindByOrderID(ctx context.Context, orderID string) (*DeliveryJob, error)
	ListAvailable(ctx context.Context, page, limit int) ([]*DeliveryJob, int64, error)
	ListByDriver(ctx context.Context, driverID string, page, limit int) ([]*DeliveryJob, int64, error)
	// TakeJob atomically assigns a driver to the job.
	// Returns a 409 conflict error if the job is already taken.
	TakeJob(ctx context.Context, jobID, driverID string) error
	CompleteJob(ctx context.Context, jobID string) error
}
