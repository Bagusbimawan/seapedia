package handler

import (
	"github.com/bagus/seapedia/internal/delivery/http/dto"
	"github.com/bagus/seapedia/internal/pkg/response"
	walletuc "github.com/bagus/seapedia/internal/usecase/wallet"
	addruc "github.com/bagus/seapedia/internal/usecase/address"
	"github.com/gofiber/fiber/v2"
)

// WalletHandler handles wallet endpoints.
type WalletHandler struct {
	uc *walletuc.Usecase
}

// NewWalletHandler creates a new WalletHandler.
func NewWalletHandler(uc *walletuc.Usecase) *WalletHandler {
	return &WalletHandler{uc: uc}
}

// GetWallet godoc
// @Summary Get buyer wallet
// @Tags buyer,wallet
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R{data=dto.WalletResponse}
// @Router /buyer/wallet [get]
func (h *WalletHandler) GetWallet(c *fiber.Ctx) error {
	w, err := h.uc.GetWallet(c.Context(), UserID(c))
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToWalletResponse(w))
}

// Topup godoc
// @Summary Top up wallet
// @Tags buyer,wallet
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.TopupReq true "Topup amount"
// @Success 200 {object} response.R{data=dto.WalletResponse}
// @Router /buyer/wallet/topup [post]
func (h *WalletHandler) Topup(c *fiber.Ctx) error {
	var req dto.TopupReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	w, err := h.uc.Topup(c.Context(), UserID(c), req.Amount)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToWalletResponse(w))
}

// ListTransactions godoc
// @Summary List wallet transactions
// @Tags buyer,wallet
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /buyer/wallet/transactions [get]
func (h *WalletHandler) ListTransactions(c *fiber.Ctx) error {
	page, limit, _ := Pagination(c)
	txs, total, err := h.uc.ListTransactions(c.Context(), UserID(c), page, limit)
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.WalletTxResponse, 0, len(txs))
	for _, t := range txs {
		items = append(items, dto.ToWalletTxResponse(t))
	}
	return response.OK(c, response.Paginated{Items: items, Total: total, Page: page, Limit: limit})
}

// AddressHandler handles address endpoints.
type AddressHandler struct {
	uc *addruc.Usecase
}

// NewAddressHandler creates a new AddressHandler.
func NewAddressHandler(uc *addruc.Usecase) *AddressHandler {
	return &AddressHandler{uc: uc}
}

// List godoc
// @Summary List buyer addresses
// @Tags buyer,addresses
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.R
// @Router /buyer/addresses [get]
func (h *AddressHandler) List(c *fiber.Ctx) error {
	addrs, err := h.uc.List(c.Context(), UserID(c))
	if err != nil {
		return HandleErr(c, err)
	}
	items := make([]dto.AddressResponse, 0, len(addrs))
	for _, a := range addrs {
		items = append(items, dto.ToAddressResponse(a))
	}
	return response.OK(c, items)
}

// Create godoc
// @Summary Create address
// @Tags buyer,addresses
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body dto.CreateAddressReq true "Address data"
// @Success 201 {object} response.R{data=dto.AddressResponse}
// @Router /buyer/addresses [post]
func (h *AddressHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateAddressReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	a, err := h.uc.Create(c.Context(), UserID(c), req.Label, req.Street, req.City, req.ZipCode, req.IsDefault)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.Created(c, dto.ToAddressResponse(a))
}

// Update godoc
// @Summary Update address
// @Tags buyer,addresses
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Address ID"
// @Success 200 {object} response.R{data=dto.AddressResponse}
// @Router /buyer/addresses/{id} [put]
func (h *AddressHandler) Update(c *fiber.Ctx) error {
	var req dto.CreateAddressReq
	if err := ParseBody(c, &req); err != nil {
		return err
	}
	a, err := h.uc.Update(c.Context(), UserID(c), c.Params("id"), req.Label, req.Street, req.City, req.ZipCode)
	if err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, dto.ToAddressResponse(a))
}

// Delete godoc
// @Summary Delete address
// @Tags buyer,addresses
// @Security BearerAuth
// @Param id path string true "Address ID"
// @Success 204
// @Router /buyer/addresses/{id} [delete]
func (h *AddressHandler) Delete(c *fiber.Ctx) error {
	if err := h.uc.Delete(c.Context(), UserID(c), c.Params("id")); err != nil {
		return HandleErr(c, err)
	}
	return response.NoContent(c)
}

// SetDefault godoc
// @Summary Set default address
// @Tags buyer,addresses
// @Security BearerAuth
// @Param id path string true "Address ID"
// @Success 200 {object} response.R
// @Router /buyer/addresses/{id}/set-default [post]
func (h *AddressHandler) SetDefault(c *fiber.Ctx) error {
	if err := h.uc.SetDefault(c.Context(), UserID(c), c.Params("id")); err != nil {
		return HandleErr(c, err)
	}
	return response.OK(c, fiber.Map{"message": "default address updated"})
}
