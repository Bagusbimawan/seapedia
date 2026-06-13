package handler

import (
	"github.com/bagus/seapedia/internal/delivery/http/dto"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/pkg/response"
	authuc "github.com/bagus/seapedia/internal/usecase/auth"
	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles auth endpoints.
type AuthHandler struct {
	uc *authuc.Usecase
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(uc *authuc.Usecase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

// Register godoc
// @Summary Register a new user
// @Tags auth
// @Accept json
// @Produce json
// @Param body body dto.RegisterReq true "Registration data"
// @Success 201 {object} response.R{data=dto.UserResponse}
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	roles := make([]user.Role, 0, len(req.Roles))
	for _, r := range req.Roles {
		roles = append(roles, user.Role(r))
	}
	u, err := h.uc.Register(c.Context(), authuc.RegisterInput{
		Username: req.Username,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: req.Password,
		Roles:    roles,
	})
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToUserResponse(u))
}

// Login godoc
// @Summary Login
// @Tags auth
// @Accept json
// @Produce json
// @Param body body dto.LoginReq true "Login credentials"
// @Success 200 {object} response.R{data=dto.LoginResponse}
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	result, err := h.uc.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.LoginResponse{
		Token:           result.Token,
		User:            dto.ToUserResponse(result.User),
		ActiveRole:      string(result.ActiveRole),
		NeedsRoleSelect: result.NeedsRoleSelect,
	})
}

// SwitchRole godoc
// @Summary Switch active role
// @Tags auth
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.SwitchRoleReq true "Role to switch to"
// @Success 200 {object} response.R
// @Router /auth/switch-role [post]
func (h *AuthHandler) SwitchRole(c *fiber.Ctx) error {
	var req dto.SwitchRoleReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	token, err := h.uc.SwitchRole(c.Context(), UserID(c), user.Role(req.Role))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, fiber.Map{"token": token, "active_role": req.Role})
}

// Me godoc
// @Summary Get current user
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R{data=dto.UserResponse}
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	u, err := h.uc.Me(c.Context(), UserID(c))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToUserResponse(u))
}
