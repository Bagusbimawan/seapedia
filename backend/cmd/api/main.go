// Package main is the entry point for the SEAPEDIA API server.
//
// @title SEAPEDIA API
// @version 1.0
// @description Multi-Role Marketplace API for COMPFEST 18
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bagus/seapedia/internal/config"
	_ "github.com/bagus/seapedia/docs"
	httphandler "github.com/bagus/seapedia/internal/delivery/http"
	"github.com/bagus/seapedia/internal/delivery/http/handler"
	"github.com/bagus/seapedia/internal/pkg/clock"
	"github.com/bagus/seapedia/internal/pkg/response"
	"github.com/bagus/seapedia/internal/repository/postgres"
	addruc "github.com/bagus/seapedia/internal/usecase/address"
	adminuc "github.com/bagus/seapedia/internal/usecase/admin"
	authuc "github.com/bagus/seapedia/internal/usecase/auth"
	cartuc "github.com/bagus/seapedia/internal/usecase/cart"
	checkoutuc "github.com/bagus/seapedia/internal/usecase/checkout"
	deliveryuc "github.com/bagus/seapedia/internal/usecase/delivery"
	discountuc "github.com/bagus/seapedia/internal/usecase/discount"
	orderuc "github.com/bagus/seapedia/internal/usecase/order"
	overdueuc "github.com/bagus/seapedia/internal/usecase/overdue"
	productuc "github.com/bagus/seapedia/internal/usecase/product"
	reviewuc "github.com/bagus/seapedia/internal/usecase/review"
	storeuc "github.com/bagus/seapedia/internal/usecase/store"
	walletuc "github.com/bagus/seapedia/internal/usecase/wallet"
	"github.com/gofiber/fiber/v2"
	"github.com/robfig/cron/v3"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	db, err := postgres.Connect(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	if err := postgres.RunPendingMigrations(db); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	// Repositories
	userRepo := postgres.NewUserRepository(db)
	storeRepo := postgres.NewStoreRepository(db)
	productRepo := postgres.NewProductRepository(db)
	walletRepo := postgres.NewWalletRepository(db)
	addressRepo := postgres.NewAddressRepository(db)
	cartRepo := postgres.NewCartRepository(db)
	orderRepo := postgres.NewOrderRepository(db)
	incomeRepo := postgres.NewSellerIncomeRepository(db)
	discountRepo := postgres.NewDiscountRepository(db)
	deliveryRepo := postgres.NewDeliveryRepository(db)
	reviewRepo := postgres.NewReviewRepository(db)
	checkoutRepo := postgres.NewCheckoutRepository(db)
	overdueRepo := postgres.NewOverdueRepository(db)
	clockRepo := postgres.NewSystemClockRepository(db)

	// Sync virtual clock from DB
	if offset, err := clockRepo.GetOffsetHours(context.Background()); err == nil {
		clock.SetOffset(offset)
	}

	// Usecases
	authUC := authuc.New(cfg, userRepo, walletRepo, cartRepo)
	storeUC := storeuc.New(storeRepo, userRepo)
	productUC := productuc.New(productRepo, storeRepo)
	walletUC := walletuc.New(walletRepo)
	addressUC := addruc.New(addressRepo)
	cartUC := cartuc.New(cartRepo, productRepo)
	checkoutUC := checkoutuc.New(
		checkoutRepo,
		checkoutuc.NewCartAdapter(cartUC),
		checkoutuc.NewAddressAdapter(addressUC),
		productRepo,
		discountRepo,
		walletRepo,
	)
	orderUC := orderuc.New(orderRepo, incomeRepo, storeRepo)
	discountUC := discountuc.New(discountRepo)
	deliveryUC := deliveryuc.New(deliveryRepo, orderRepo, walletRepo)
	reviewUC := reviewuc.New(reviewRepo)
	overdueUC := overdueuc.New(orderRepo, overdueRepo)
	adminUC := adminuc.New(userRepo, storeRepo, orderRepo, clockRepo, overdueUC)

	// Cron: check overdue orders every minute
	c := cron.New()
	_, _ = c.AddFunc("@every 1m", func() {
		if err := overdueUC.ProcessAll(context.Background()); err != nil {
			log.Printf("cron overdue: %v", err)
		}
	})
	c.Start()

	// Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			if e, ok := err.(*fiber.Error); ok && e.Code == fiber.StatusNotFound {
				return response.NotFound(c, "endpoint not found")
			}
			return handler.HandleErr(c, err)
		},
	})

	handlers := &httphandler.Handlers{
		Auth:     handler.NewAuthHandler(authUC),
		Store:    handler.NewStoreHandler(storeUC),
		Product:  handler.NewProductHandler(productUC),
		Wallet:   handler.NewWalletHandler(walletUC),
		Address:  handler.NewAddressHandler(addressUC),
		Cart:     handler.NewCartHandler(cartUC),
		Checkout: handler.NewCheckoutHandler(checkoutUC),
		Order:    handler.NewOrderHandler(orderUC),
		Discount: handler.NewDiscountHandler(discountUC),
		Delivery: handler.NewDeliveryHandler(deliveryUC),
		Review:   handler.NewReviewHandler(reviewUC),
		Admin:    handler.NewAdminHandler(adminUC),
	}

	httphandler.NewRouter(app, cfg, handlers)

	// Swagger UI — http://localhost:8080/swagger/index.html
	httphandler.RegisterSwagger(app)

	// Graceful shutdown
	go func() {
		addr := fmt.Sprintf(":%s", cfg.Port)
		log.Printf("SEAPEDIA API starting on %s", addr)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	c.Stop()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = ctx
	if err := app.Shutdown(); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}
