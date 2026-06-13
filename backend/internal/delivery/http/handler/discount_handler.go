package handler

import (
	"strings"
	"time"

	"github.com/bagus/seapedia/internal/delivery/http/dto"
	"github.com/bagus/seapedia/internal/domain/discount"
	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/pkg/response"
	discountuc "github.com/bagus/seapedia/internal/usecase/discount"
	deliveryuc "github.com/bagus/seapedia/internal/usecase/delivery"
	reviewuc "github.com/bagus/seapedia/internal/usecase/review"
	adminuc "github.com/bagus/seapedia/internal/usecase/admin"
	"github.com/gofiber/fiber/v2"
)

// DiscountHandler handles discount endpoints.
type DiscountHandler struct {
	uc *discountuc.Usecase
}

// NewDiscountHandler creates a new DiscountHandler.
func NewDiscountHandler(uc *discountuc.Usecase) *DiscountHandler {
	return &DiscountHandler{uc: uc}
}

// ListVouchers godoc
// @Summary List vouchers
// @Tags discounts
// @Produce json
// @Success 200 {object} response.R
// @Router /vouchers [get]
func (h *DiscountHandler) ListVouchers(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	items, total, err := h.uc.ListVouchers(c.Context(), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	resp := make([]dto.DiscountResponse, 0, len(items))
	for _, d := range items {
		resp = append(resp, dto.ToDiscountResponse(d))
	}
	return response.OK(c, response.Paginated{Items: resp, Total: total, Page: page, Limit: limit})
}

// ListPromos godoc
// @Summary List promos
// @Tags discounts
// @Produce json
// @Success 200 {object} response.R
// @Router /promos [get]
func (h *DiscountHandler) ListPromos(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	items, total, err := h.uc.ListPromos(c.Context(), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	resp := make([]dto.DiscountResponse, 0, len(items))
	for _, d := range items {
		resp = append(resp, dto.ToDiscountResponse(d))
	}
	return response.OK(c, response.Paginated{Items: resp, Total: total, Page: page, Limit: limit})
}

// CreateVoucher godoc
// @Summary Create voucher
// @Tags admin,discounts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreateVoucherReq true "Voucher data"
// @Success 201 {object} response.R{data=dto.DiscountResponse}
// @Router /admin/vouchers [post]
func (h *DiscountHandler) CreateVoucher(c *fiber.Ctx) error {
	var req dto.CreateVoucherReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	expiry, err := time.Parse(time.RFC3339, req.ExpiryDate)
	if err != nil {
		return response.BadRequest(c, "invalid expiry_date format, use RFC3339")
	}
	d, err := h.uc.CreateVoucher(c.Context(), req.Code, discount.DiscountType(req.DiscountType), req.DiscountValue, expiry, req.RemainingUsage)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToDiscountResponse(d))
}

// CreatePromo godoc
// @Summary Create promo
// @Tags admin,discounts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreatePromoReq true "Promo data"
// @Success 201 {object} response.R{data=dto.DiscountResponse}
// @Router /admin/promos [post]
func (h *DiscountHandler) CreatePromo(c *fiber.Ctx) error {
	var req dto.CreatePromoReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	expiry, err := time.Parse(time.RFC3339, req.ExpiryDate)
	if err != nil {
		return response.BadRequest(c, "invalid expiry_date format, use RFC3339")
	}
	d, err := h.uc.CreatePromo(c.Context(), req.Code, discount.DiscountType(req.DiscountType), req.DiscountValue, expiry)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToDiscountResponse(d))
}

// Validate godoc
// @Summary Validate discount code
// @Tags buyer,discounts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.ValidateDiscountReq true "Discount code"
// @Success 200 {object} response.R
// @Router /buyer/discount/validate [post]
func (h *DiscountHandler) Validate(c *fiber.Ctx) error {
	var req dto.ValidateDiscountReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	code := strings.TrimSpace(strings.ToUpper(req.Code))
	d, amount, err := h.uc.Validate(c.Context(), code, req.Subtotal)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, fiber.Map{
		"discount":        dto.ToDiscountResponse(d),
		"discount_amount": amount,
	})
}

// DeliveryHandler handles delivery job endpoints.
type DeliveryHandler struct {
	uc *deliveryuc.Usecase
}

// NewDeliveryHandler creates a new DeliveryHandler.
func NewDeliveryHandler(uc *deliveryuc.Usecase) *DeliveryHandler {
	return &DeliveryHandler{uc: uc}
}

// ListAvailable godoc
// @Summary List available delivery jobs
// @Tags driver
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /driver/jobs [get]
func (h *DeliveryHandler) ListAvailable(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	jobs, total, err := h.uc.ListAvailable(c.Context(), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.DeliveryJobResponse, 0, len(jobs))
	for _, j := range jobs {
		items = append(items, dto.ToDeliveryJobResponse(j))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// TakeJob godoc
// @Summary Take a delivery job
// @Tags driver
// @Security BearerAuth
// @Param id path string true "Job ID"
// @Success 200 {object} response.R{data=dto.DeliveryJobResponse}
// @Router /driver/jobs/{id}/take [post]
func (h *DeliveryHandler) TakeJob(c *fiber.Ctx) error {
	job, err := h.uc.TakeJob(c.Context(), UserID(c), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToDeliveryJobResponse(job))
}

// CompleteJob godoc
// @Summary Complete a delivery job
// @Tags driver
// @Security BearerAuth
// @Param id path string true "Job ID"
// @Success 200 {object} response.R{data=dto.DeliveryJobResponse}
// @Router /driver/jobs/{id}/complete [post]
func (h *DeliveryHandler) CompleteJob(c *fiber.Ctx) error {
	job, err := h.uc.CompleteJob(c.Context(), UserID(c), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToDeliveryJobResponse(job))
}

// ListHistory godoc
// @Summary List driver job history
// @Tags driver
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /driver/jobs/history [get]
func (h *DeliveryHandler) ListHistory(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	jobs, total, err := h.uc.ListHistory(c.Context(), UserID(c), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.DeliveryJobResponse, 0, len(jobs))
	for _, j := range jobs {
		items = append(items, dto.ToDeliveryJobResponse(j))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// ReviewHandler handles review endpoints.
type ReviewHandler struct {
	uc *reviewuc.Usecase
}

// NewReviewHandler creates a new ReviewHandler.
func NewReviewHandler(uc *reviewuc.Usecase) *ReviewHandler {
	return &ReviewHandler{uc: uc}
}

// List godoc
// @Summary List reviews
// @Tags reviews
// @Produce json
// @Success 200 {object} response.R
// @Router /reviews [get]
func (h *ReviewHandler) List(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	reviews, total, err := h.uc.List(c.Context(), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.ReviewResponse, 0, len(reviews))
	for _, r := range reviews {
		items = append(items, dto.ToReviewResponse(r))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// Create godoc
// @Summary Create review
// @Tags reviews
// @Accept json
// @Produce json
// @Param body body dto.CreateReviewReq true "Review data"
// @Success 201 {object} response.R{data=dto.ReviewResponse}
// @Router /reviews [post]
func (h *ReviewHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateReviewReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	r, err := h.uc.Create(c.Context(), req.ReviewerName, req.Rating, req.Comment, nil)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToReviewResponse(r))
}

// AdminHandler handles admin endpoints.
type AdminHandler struct {
	uc *adminuc.Usecase
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(uc *adminuc.Usecase) *AdminHandler {
	return &AdminHandler{uc: uc}
}

// ListUsers godoc
// @Summary List all users
// @Tags admin
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /admin/users [get]
func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	users, total, err := h.uc.ListUsers(c.Context(), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.UserResponse, 0, len(users))
	for _, u := range users {
		items = append(items, dto.ToUserResponse(u))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// ListStores godoc
// @Summary List all stores
// @Tags admin
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /admin/stores [get]
func (h *AdminHandler) ListStores(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	stores, total, err := h.uc.ListStores(c.Context(), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.StoreResponse, 0, len(stores))
	for _, s := range stores {
		items = append(items, dto.ToStoreResponse(s))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// ListOrders godoc
// @Summary List all orders
// @Tags admin
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /admin/orders [get]
func (h *AdminHandler) ListOrders(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	var status *order.Status
	if s := c.Query("status"); s != "" {
		st := order.Status(s)
		status = &st
	}
	orders, total, err := h.uc.ListOrders(c.Context(), status, page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.OrderResponse, 0, len(orders))
	for _, o := range orders {
		items = append(items, dto.ToOrderResponse(o))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// AdvanceDay godoc
// @Summary Advance virtual clock by one day
// @Tags admin
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R{data=dto.AdvanceDayResponse}
// @Router /admin/advance-day [post]
func (h *AdminHandler) AdvanceDay(c *fiber.Ctx) error {
	offset, err := h.uc.AdvanceDay(c.Context())
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.AdvanceDayResponse{OffsetHours: offset})
}
