package postgres

import (
	"strings"

	"github.com/bagus/seapedia/internal/pkg/apperror"
)

// MapDBErr converts common postgres errors into AppError.
func MapDBErr(err error) error {
	if err == nil {
		return nil
	}
	msg := strings.ToLower(err.Error())

	if strings.Contains(msg, "duplicate key") || strings.Contains(msg, "unique constraint") {
		switch {
		case strings.Contains(msg, "email"):
			return apperror.Conflict("email sudah terdaftar")
		case strings.Contains(msg, "username"):
			return apperror.Conflict("username sudah digunakan")
		case strings.Contains(msg, "stores") && strings.Contains(msg, "name"):
			return apperror.Conflict("nama toko sudah digunakan")
		default:
			return apperror.Conflict("data sudah ada")
		}
	}

	if strings.Contains(msg, "provisioned_by") || strings.Contains(msg, "demo_password") {
		return apperror.BadRequest("database perlu migrasi — restart backend setelah deploy terbaru")
	}

	return err
}
