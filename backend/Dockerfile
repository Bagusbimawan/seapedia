# Stage 1: Builder
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -extldflags '-static'" \
    -o /app/bin/seapedia ./cmd/api/main.go

# Stage 2: Runner (alpine — support healthcheck & TLS to managed DB)
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata wget

COPY --from=builder /app/bin/seapedia /usr/local/bin/seapedia

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/seapedia"]
