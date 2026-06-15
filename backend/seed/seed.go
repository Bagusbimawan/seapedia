package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/bagus/seapedia/internal/config"
	"github.com/bagus/seapedia/internal/domain/cart"
	"github.com/bagus/seapedia/internal/domain/discount"
	"github.com/bagus/seapedia/internal/domain/product"
	"github.com/bagus/seapedia/internal/domain/store"
	"github.com/bagus/seapedia/internal/domain/user"
	"github.com/bagus/seapedia/internal/domain/wallet"
	"github.com/bagus/seapedia/internal/pkg/hash"
	"github.com/bagus/seapedia/internal/repository/postgres"
	"github.com/google/uuid"
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

	ctx := context.Background()
	userRepo := postgres.NewUserRepository(db)
	storeRepo := postgres.NewStoreRepository(db)
	productRepo := postgres.NewProductRepository(db)
	walletRepo := postgres.NewWalletRepository(db)
	cartRepo := postgres.NewCartRepository(db)
	discountRepo := postgres.NewDiscountRepository(db)

	accounts := []struct {
		email    string
		password string
		username string
		roles    []user.Role
		extra    func(userID string)
	}{
		{
			email: "admin@seapedia.com", password: "admin123", username: "admin",
			roles: []user.Role{user.RoleAdmin},
		},
		{
			email: "seller@seapedia.com", password: "seller123", username: "seller",
			roles: []user.Role{user.RoleSeller},
			extra: func(userID string) {
				s := &store.Store{
					ID:            uuid.New().String(),
					SellerUserID:  userID,
					Name:          "Toko Contoh",
					Description:   "Toko contoh untuk demo SEAPEDIA",
					ProvisionedBy: store.ProvisionedSeed,
				}
				if err := storeRepo.Create(ctx, s); err != nil {
					log.Printf("store seed: %v", err)
					return
				}
				products := []struct {
					name  string
					price int64
					stock int
				}{
					{"Produk A", 50000, 100},
					{"Produk B", 75000, 50},
					{"Produk C", 100000, 30},
				}
				for _, p := range products {
					prod := &product.Product{
						ID:          uuid.New().String(),
						StoreID:     s.ID,
						Name:        p.name,
						Description: fmt.Sprintf("Deskripsi %s", p.name),
						Price:       p.price,
						Stock:       p.stock,
					}
					if err := productRepo.Create(ctx, prod); err != nil {
						log.Printf("product seed: %v", err)
					}
				}
			},
		},
		{
			email: "buyer@seapedia.com", password: "buyer123", username: "buyer",
			roles: []user.Role{user.RoleBuyer},
			extra: func(userID string) {
				w := &wallet.Wallet{
					ID:      uuid.New().String(),
					UserID:  userID,
					Balance: 500000,
				}
				if err := walletRepo.CreateWallet(ctx, w); err != nil {
					log.Printf("wallet seed: %v", err)
				}
				c := &cart.Cart{
					ID:     uuid.New().String(),
					UserID: userID,
				}
				if err := cartRepo.CreateCart(ctx, c); err != nil {
					log.Printf("cart seed: %v", err)
				}
			},
		},
		{
			email: "driver@seapedia.com", password: "driver123", username: "driver",
			roles: []user.Role{user.RoleDriver},
			extra: func(userID string) {
				w := &wallet.Wallet{
					ID:      uuid.New().String(),
					UserID:  userID,
					Balance: 0,
				}
				if err := walletRepo.CreateWallet(ctx, w); err != nil {
					log.Printf("driver wallet seed: %v", err)
				}
			},
		},
	}

	for _, acc := range accounts {
		if _, err := userRepo.FindByEmail(ctx, acc.email); err == nil {
			log.Printf("skip %s (already exists)", acc.email)
			continue
		}

		pw, err := hash.Hash(acc.password)
		if err != nil {
			log.Fatalf("hash: %v", err)
		}

		u := &user.User{
			ID:           uuid.New().String(),
			Username:     acc.username,
			Email:        acc.email,
			PasswordHash: pw,
			Roles:        acc.roles,
		}
		if err := userRepo.Create(ctx, u); err != nil {
			log.Printf("user seed %s: %v", acc.email, err)
			continue
		}
		if acc.extra != nil {
			acc.extra(u.ID)
		}
		log.Printf("seeded user: %s", acc.email)
	}

	// Seed sample voucher
	usage := 100
	voucher := &discount.Discount{
		ID:             uuid.New().String(),
		Code:           "DISC20",
		Kind:           discount.KindVoucher,
		DiscountType:   discount.TypePercent,
		DiscountValue:  20,
		ExpiryDate:     time.Now().UTC().AddDate(1, 0, 0),
		RemainingUsage: &usage,
	}
	if _, err := discountRepo.FindByCode(ctx, "DISC20"); err != nil {
		if err := discountRepo.Create(ctx, voucher); err != nil {
			log.Printf("voucher seed: %v", err)
		} else {
			log.Println("seeded voucher: DISC20")
		}
	}

	log.Println("seed completed")
}
