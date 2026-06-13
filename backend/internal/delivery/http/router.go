package http

import (
	"github.com/bagus/seapedia/internal/config"
	"github.com/bagus/seapedia/internal/delivery/http/handler"
	"github.com/bagus/seapedia/internal/delivery/http/middleware"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	swagger "github.com/swaggo/fiber-swagger"
)

// Handlers groups all HTTP handlers.
type Handlers struct {
	Auth     *handler.AuthHandler
	Store    *handler.StoreHandler
	Product  *handler.ProductHandler
	Wallet   *handler.WalletHandler
	Address  *handler.AddressHandler
	Cart     *handler.CartHandler
	Checkout *handler.CheckoutHandler
	Order    *handler.OrderHandler
	Discount *handler.DiscountHandler
	Delivery *handler.DeliveryHandler
	Review   *handler.ReviewHandler
	Admin    *handler.AdminHandler
}

// NewRouter wires all routes.
func NewRouter(app *fiber.App, cfg *config.Config, h *Handlers) {
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))

	api := app.Group("/api/v1")

	// Public routes
	api.Post("/auth/register", h.Auth.Register)
	api.Post("/auth/login", h.Auth.Login)
	api.Get("/products", h.Product.ListPublic)
	api.Get("/products/:id", h.Product.GetByID)
	api.Get("/stores/:id", h.Store.GetPublic)
	api.Get("/vouchers", h.Discount.ListVouchers)
	api.Get("/promos", h.Discount.ListPromos)
	api.Get("/reviews", h.Review.List)
	api.Post("/reviews", h.Review.Create)

	// Authenticated routes
	authMW := middleware.Auth(cfg)

	api.Get("/auth/me", authMW, h.Auth.Me)
	api.Post("/auth/switch-role", authMW, h.Auth.SwitchRole)

	// Seller routes
	seller := api.Group("/seller", authMW, middleware.RequireRole(user.RoleSeller))
	seller.Get("/store", h.Store.GetSellerStore)
	seller.Post("/store", h.Store.CreateStore)
	seller.Put("/store", h.Store.UpdateStore)
	seller.Get("/products", h.Product.ListSeller)
	seller.Post("/products", h.Product.Create)
	seller.Put("/products/:id", h.Product.Update)
	seller.Delete("/products/:id", h.Product.Delete)
	seller.Get("/orders", h.Order.ListSeller)
	seller.Get("/orders/:id", h.Order.GetSeller)
	seller.Post("/orders/:id/ready", h.Order.MarkReady)
	seller.Get("/income", h.Order.ListIncome)

	// Buyer routes
	buyer := api.Group("/buyer", authMW, middleware.RequireRole(user.RoleBuyer))
	buyer.Get("/wallet", h.Wallet.GetWallet)
	buyer.Post("/wallet/topup", h.Wallet.Topup)
	buyer.Get("/wallet/transactions", h.Wallet.ListTransactions)
	buyer.Get("/addresses", h.Address.List)
	buyer.Post("/addresses", h.Address.Create)
	buyer.Put("/addresses/:id", h.Address.Update)
	buyer.Delete("/addresses/:id", h.Address.Delete)
	buyer.Post("/addresses/:id/set-default", h.Address.SetDefault)
	buyer.Get("/cart", h.Cart.Get)
	buyer.Post("/cart/items", h.Cart.AddItem)
	buyer.Put("/cart/items/:productId", h.Cart.UpdateItem)
	buyer.Delete("/cart/items/:productId", h.Cart.RemoveItem)
	buyer.Delete("/cart", h.Cart.Clear)
	buyer.Post("/checkout", h.Checkout.Checkout)
	buyer.Get("/orders", h.Order.ListBuyer)
	buyer.Get("/orders/:id", h.Order.GetBuyer)
	buyer.Post("/discount/validate", h.Discount.Validate)

	// Driver routes
	driver := api.Group("/driver", authMW, middleware.RequireRole(user.RoleDriver))
	driver.Get("/jobs", h.Delivery.ListAvailable)
	driver.Get("/jobs/history", h.Delivery.ListHistory)
	driver.Post("/jobs/:id/take", h.Delivery.TakeJob)
	driver.Post("/jobs/:id/complete", h.Delivery.CompleteJob)

	// Admin routes
	admin := api.Group("/admin", authMW, middleware.RequireRole(user.RoleAdmin))
	admin.Get("/users", h.Admin.ListUsers)
	admin.Get("/stores", h.Admin.ListStores)
	admin.Get("/orders", h.Admin.ListOrders)
	admin.Post("/vouchers", h.Discount.CreateVoucher)
	admin.Post("/promos", h.Discount.CreatePromo)
	admin.Post("/advance-day", h.Admin.AdvanceDay)
}

// RegisterSwagger mounts OpenAPI documentation UI.
func RegisterSwagger(app *fiber.App) {
	app.Get("/swagger/*", swagger.WrapHandler)
}
