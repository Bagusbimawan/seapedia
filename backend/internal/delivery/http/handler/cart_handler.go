package handler

import (
	"github.com/bagus/seapedia/internal/delivery/http/dto"
	"github.com/bagus/seapedia/internal/domain/order"
	"github.com/bagus/seapedia/internal/pkg/response"
	cartuc "github.com/bagus/seapedia/internal/usecase/cart"
	checkoutuc "github.com/bagus/seapedia/internal/usecase/checkout"
	orderuc "github.com/bagus/seapedia/internal/usecase/order"
	"github.com/gofiber/fiber/v2"
)

// CartHandler handles cart endpoints.
type CartHandler struct {
	uc *cartuc.Usecase
}

// NewCartHandler creates a new CartHandler.
func NewCartHandler(uc *cartuc.Usecase) *CartHandler {
	return &CartHandler{uc: uc}
}

// Get godoc
// @Summary Get buyer cart
// @Tags buyer,cart
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R{data=dto.CartResponse}
// @Router /buyer/cart [get]
func (h *CartHandler) Get(c *fiber.Ctx) error {
	cart, err := h.uc.GetOrCreate(c.Context(), UserID(c))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToCartResponse(cart))
}

// AddItem godoc
// @Summary Add item to cart
// @Tags buyer,cart
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.AddCartItemReq true "Cart item"
// @Success 200 {object} response.R{data=dto.CartResponse}
// @Router /buyer/cart/items [post]
func (h *CartHandler) AddItem(c *fiber.Ctx) error {
	var req dto.AddCartItemReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	cart, err := h.uc.AddItem(c.Context(), UserID(c), req.ProductID, req.Quantity)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToCartResponse(cart))
}

// UpdateItem godoc
// @Summary Update cart item quantity
// @Tags buyer,cart
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param productId path string true "Product ID"
// @Param body body dto.UpdateCartItemReq true "Quantity"
// @Success 200 {object} response.R{data=dto.CartResponse}
// @Router /buyer/cart/items/{productId} [put]
func (h *CartHandler) UpdateItem(c *fiber.Ctx) error {
	var req dto.UpdateCartItemReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	cart, err := h.uc.UpdateItem(c.Context(), UserID(c), c.Params("productId"), req.Quantity)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToCartResponse(cart))
}

// RemoveItem godoc
// @Summary Remove item from cart
// @Tags buyer,cart
// @Security BearerAuth
// @Param productId path string true "Product ID"
// @Success 200 {object} response.R{data=dto.CartResponse}
// @Router /buyer/cart/items/{productId} [delete]
func (h *CartHandler) RemoveItem(c *fiber.Ctx) error {
	cart, err := h.uc.RemoveItem(c.Context(), UserID(c), c.Params("productId"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToCartResponse(cart))
}

// Clear godoc
// @Summary Clear cart
// @Tags buyer,cart
// @Security BearerAuth
// @Success 204
// @Router /buyer/cart [delete]
func (h *CartHandler) Clear(c *fiber.Ctx) error {
	if err := h.uc.Clear(c.Context(), UserID(c)); err != nil {
		return HandleErr(c, err)
	}
	return response.NoContent(c)
}

// CheckoutHandler handles checkout endpoints.
type CheckoutHandler struct {
	uc *checkoutuc.Usecase
}

// NewCheckoutHandler creates a new CheckoutHandler.
func NewCheckoutHandler(uc *checkoutuc.Usecase) *CheckoutHandler {
	return &CheckoutHandler{uc: uc}
}

// Checkout godoc
// @Summary Checkout cart
// @Tags buyer,checkout
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CheckoutReq true "Checkout data"
// @Success 201 {object} response.R{data=dto.OrderResponse}
// @Router /buyer/checkout [post]
func (h *CheckoutHandler) Checkout(c *fiber.Ctx) error {
	var req dto.CheckoutReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	o, err := h.uc.Execute(c.Context(), UserID(c), checkoutuc.Input{
		AddressID:      req.AddressID,
		DeliveryMethod: order.DeliveryMethod(req.DeliveryMethod),
		DiscountCode:   req.DiscountCode,
	})
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToOrderResponse(o))
}

// OrderHandler handles order endpoints.
type OrderHandler struct {
	uc *orderuc.Usecase
}

// NewOrderHandler creates a new OrderHandler.
func NewOrderHandler(uc *orderuc.Usecase) *OrderHandler {
	return &OrderHandler{uc: uc}
}

// ListBuyer godoc
// @Summary List buyer orders
// @Tags buyer,orders
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /buyer/orders [get]
func (h *OrderHandler) ListBuyer(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	orders, total, err := h.uc.ListBuyerOrders(c.Context(), UserID(c), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.OrderResponse, 0, len(orders))
	for _, o := range orders {
		items = append(items, dto.ToOrderResponse(o))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// GetBuyer godoc
// @Summary Get buyer order detail
// @Tags buyer,orders
// @Security BearerAuth
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} response.R{data=dto.OrderResponse}
// @Router /buyer/orders/{id} [get]
func (h *OrderHandler) GetBuyer(c *fiber.Ctx) error {
	o, err := h.uc.GetBuyerOrder(c.Context(), UserID(c), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToOrderResponse(o))
}

// ListSeller godoc
// @Summary List seller orders
// @Tags seller,orders
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /seller/orders [get]
func (h *OrderHandler) ListSeller(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	var status *order.Status
	if s := c.Query("status"); s != "" {
		st := order.Status(s)
		status = &st
	}
	orders, total, err := h.uc.ListSellerOrders(c.Context(), UserID(c), status, page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.OrderResponse, 0, len(orders))
	for _, o := range orders {
		items = append(items, dto.ToOrderResponse(o))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// GetSeller godoc
// @Summary Get seller order detail
// @Tags seller,orders
// @Security BearerAuth
// @Produce json
// @Param id path string true "Order ID"
// @Success 200 {object} response.R{data=dto.OrderResponse}
// @Router /seller/orders/{id} [get]
func (h *OrderHandler) GetSeller(c *fiber.Ctx) error {
	o, err := h.uc.GetSellerOrder(c.Context(), UserID(c), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToOrderResponse(o))
}

// MarkReady godoc
// @Summary Mark order ready for delivery
// @Tags seller,orders
// @Security BearerAuth
// @Param id path string true "Order ID"
// @Success 200 {object} response.R{data=dto.OrderResponse}
// @Router /seller/orders/{id}/ready [post]
func (h *OrderHandler) MarkReady(c *fiber.Ctx) error {
	o, err := h.uc.MarkReady(c.Context(), UserID(c), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToOrderResponse(o))
}

// ListIncome godoc
// @Summary List seller income
// @Tags seller,income
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /seller/income [get]
func (h *OrderHandler) ListIncome(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	incomes, total, err := h.uc.ListSellerIncome(c.Context(), UserID(c), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.SellerIncomeResponse, 0, len(incomes))
	for _, i := range incomes {
		items = append(items, dto.ToSellerIncomeResponse(i))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}
