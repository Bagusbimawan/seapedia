package user

import "time"

// Role represents a user's role in the system.
type Role string

const (
	RoleAdmin   Role = "ADMIN"
	RoleSeller  Role = "SELLER"
	RoleBuyer   Role = "BUYER"
	RoleDriver  Role = "DRIVER"
	RolePending Role = "PENDING"
)

// User is the core user domain entity.
type User struct {
	ID           string
	Username     string
	Email        string
	Phone        string
	PasswordHash string
	Roles        []Role
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// HasRole reports whether the user has the given role.
func (u *User) HasRole(r Role) bool {
	for _, role := range u.Roles {
		if role == r {
			return true
		}
	}
	return false
}

// DetermineActiveRole returns the default active role for the user:
//   - If the user has the ADMIN role → ADMIN
//   - If the user has exactly one non-admin role → that role
//   - If the user has two or more non-admin roles → PENDING (requires role selection)
func (u *User) DetermineActiveRole() Role {
	if u.HasRole(RoleAdmin) {
		return RoleAdmin
	}

	var nonAdminRoles []Role
	for _, r := range u.Roles {
		if r != RoleAdmin {
			nonAdminRoles = append(nonAdminRoles, r)
		}
	}

	switch len(nonAdminRoles) {
	case 0:
		return RolePending
	case 1:
		return nonAdminRoles[0]
	default:
		return RolePending
	}
}
