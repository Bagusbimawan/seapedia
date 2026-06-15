package handler

import (
	"github.com/bagus/seapedia/internal/delivery/http/dto"
	"github.com/bagus/seapedia/internal/pkg/response"
	productuc "github.com/bagus/seapedia/internal/usecase/product"
	storeuc "github.com/bagus/seapedia/internal/usecase/store"
	"github.com/gofiber/fiber/v2"
)

// StoreHandler handles store endpoints.
type StoreHandler struct {
	uc *storeuc.Usecase
}

// NewStoreHandler creates a new StoreHandler.
func NewStoreHandler(uc *storeuc.Usecase) *StoreHandler {
	return &StoreHandler{uc: uc}
}

// GetPublic godoc
// @Summary Get store by ID
// @Tags stores
// @Produce json
// @Param id path string true "Store ID"
// @Success 200 {object} response.R{data=dto.StoreResponse}
// @Router /stores/{id} [get]
func (h *StoreHandler) GetPublic(c *fiber.Ctx) error {
	s, err := h.uc.GetPublicStore(c.Context(), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToStoreResponse(s))
}

// ListDemoSellers godoc
// @Summary List sellers with stores for demo login panel
// @Tags demo
// @Produce json
// @Success 200 {object} response.R
// @Router /demo/sellers [get]
func (h *StoreHandler) ListDemoSellers(c *fiber.Ctx) error {
	sellers, err := h.uc.ListDemoSellers(c.Context())
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.DemoSellerResponse, 0, len(sellers))
	for _, s := range sellers {
		items = append(items, dto.ToDemoSellerResponse(s.Email, s.Username, s.StoreName, s.DemoPassword))
	}
	return response.OK(c, items)
}

// GetSellerStore godoc
// @Summary Get seller's store
// @Tags seller
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R{data=dto.StoreResponse}
// @Router /seller/store [get]
func (h *StoreHandler) GetSellerStore(c *fiber.Ctx) error {
	s, err := h.uc.GetSellerStore(c.Context(), UserID(c))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToStoreResponse(s))
}

// CreateStore godoc
// @Summary Create seller store
// @Tags seller
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreateStoreReq true "Store data"
// @Success 201 {object} response.R{data=dto.StoreResponse}
// @Router /seller/store [post]
func (h *StoreHandler) CreateStore(c *fiber.Ctx) error {
	var req dto.CreateStoreReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	s, err := h.uc.CreateStore(c.Context(), UserID(c), req.Name, req.Description)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToStoreResponse(s))
}

// UpdateStore godoc
// @Summary Update seller store
// @Tags seller
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreateStoreReq true "Store data"
// @Success 200 {object} response.R{data=dto.StoreResponse}
// @Router /seller/store [put]
func (h *StoreHandler) UpdateStore(c *fiber.Ctx) error {
	var req dto.CreateStoreReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	s, err := h.uc.UpdateStore(c.Context(), UserID(c), req.Name, req.Description)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToStoreResponse(s))
}

// ProductHandler handles product endpoints.
type ProductHandler struct {
	uc *productuc.Usecase
}

// NewProductHandler creates a new ProductHandler.
func NewProductHandler(uc *productuc.Usecase) *ProductHandler {
	return &ProductHandler{uc: uc}
}

// ListPublic godoc
// @Summary List products
// @Tags products
// @Produce json
// @Param search query string false "Search term"
// @Param page query int false "Page"
// @Param limit query int false "Limit"
// @Success 200 {object} response.R
// @Router /products [get]
func (h *ProductHandler) ListPublic(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	search := c.Query("search")
	products, total, err := h.uc.ListPublic(c.Context(), search, page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.ProductResponse, 0, len(products))
	for _, p := range products {
		items = append(items, dto.ToProductResponse(p))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// GetByID godoc
// @Summary Get product by ID
// @Tags products
// @Produce json
// @Param id path string true "Product ID"
// @Success 200 {object} response.R{data=dto.ProductResponse}
// @Router /products/{id} [get]
func (h *ProductHandler) GetByID(c *fiber.Ctx) error {
	p, err := h.uc.GetByID(c.Context(), c.Params("id"))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToProductResponse(p))
}

// ListSeller godoc
// @Summary List seller products
// @Tags seller,products
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /seller/products [get]
func (h *ProductHandler) ListSeller(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	products, total, err := h.uc.ListBySeller(c.Context(), UserID(c), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.ProductResponse, 0, len(products))
	for _, p := range products {
		items = append(items, dto.ToProductResponse(p))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// Create godoc
// @Summary Create product
// @Tags seller,products
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreateProductReq true "Product data"
// @Success 201 {object} response.R{data=dto.ProductResponse}
// @Router /seller/products [post]
func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateProductReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	p, err := h.uc.Create(c.Context(), UserID(c), req.Name, req.Description, req.Price, req.Stock)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToProductResponse(p))
}

// Update godoc
// @Summary Update product
// @Tags seller,products
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Product ID"
// @Param body body dto.CreateProductReq true "Product data"
// @Success 200 {object} response.R{data=dto.ProductResponse}
// @Router /seller/products/{id} [put]
func (h *ProductHandler) Update(c *fiber.Ctx) error {
	var req dto.CreateProductReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	p, err := h.uc.Update(c.Context(), UserID(c), c.Params("id"), req.Name, req.Description, req.Price, req.Stock)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToProductResponse(p))
}

// Delete godoc
// @Summary Delete product
// @Tags seller,products
// @Security BearerAuth
// @Param id path string true "Product ID"
// @Success 204
// @Router /seller/products/{id} [delete]
func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	if err := h.uc.Delete(c.Context(), UserID(c), c.Params("id")); err != nil {
		return HandleErr(c, err)
	}
	return response.NoContent(c)
}
