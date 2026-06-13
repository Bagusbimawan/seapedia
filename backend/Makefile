.PHONY: run build test migrate-up migrate-down seed swag lint tidy docker-up docker-down

APP_NAME=seapedia
MAIN=./cmd/api
MIGRATIONS_DIR=./migrations
DB_URL?=postgres://seapedia:seapedia123@localhost:5432/seapedia_db?sslmode=disable

run:
	go run $(MAIN)/main.go

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
	psql "$(DB_URL)" -f $(MIGRATIONS_DIR)/001_initial.up.sql

migrate-down:
	psql "$(DB_URL)" -f $(MIGRATIONS_DIR)/001_initial.down.sql

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
