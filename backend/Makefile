.PHONY: run build test migrate-up migrate-down db-reset seed swag swagger stop lint tidy docker-up docker-down

APP_NAME=seapedia
MAIN=./cmd/api
MIGRATIONS_DIR=./migrations
DB_URL?=postgres://seapedia:seapedia123@localhost:5432/seapedia_db?sslmode=disable
COMPOSE=docker compose --project-directory ..
DOCKER_PG=$(COMPOSE) exec -T postgres psql -U seapedia -d seapedia_db -v ON_ERROR_STOP=1

run:
	go run $(MAIN)/main.go

stop:
	@-lsof -ti :8080 | xargs kill -9 2>/dev/null || true
	@echo "Port 8080 cleared"

dev:
	air

build:
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/$(APP_NAME) $(MAIN)/main.go

test:
	go test ./... -v -race -coverprofile=coverage.out

test-coverage:
	go tool cover -html=coverage.out -o coverage.html

lint:
	golangci-lint run ./...

tidy:
	go mod tidy

swag:
	swag init -g $(MAIN)/main.go -o ./docs

swagger: swag

migrate-up:
	psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/001_initial.up.sql
	psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/002_store_provision.up.sql

migrate-down:
	psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/002_store_provision.down.sql || true
	psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/001_initial.down.sql

# Hapus semua data, migrate ulang, seed demo accounts
db-reset: migrate-down migrate-up seed
	@echo "✓ db-reset selesai — login: admin@seapedia.com / admin123"

# Sama seperti db-reset, lewat container postgres (jika psql tidak terpasang di host)
db-reset-docker:
	-cat $(MIGRATIONS_DIR)/002_store_provision.down.sql | $(DOCKER_PG)
	cat $(MIGRATIONS_DIR)/001_initial.down.sql | $(DOCKER_PG)
	cat $(MIGRATIONS_DIR)/001_initial.up.sql | $(DOCKER_PG)
	cat $(MIGRATIONS_DIR)/002_store_provision.up.sql | $(DOCKER_PG)
	$(MAKE) seed
	@echo "✓ db-reset-docker selesai — login: admin@seapedia.com / admin123"

seed:
	go run ./seed/seed.go

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker build -t $(APP_NAME):latest .

clean:
	rm -rf bin/ tmp/ coverage.out coverage.html
