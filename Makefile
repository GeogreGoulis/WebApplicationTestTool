.PHONY: help install build clean dev up down logs test lint format

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing root dependencies..."
	npm install
	@echo "Installing service dependencies..."
	cd services/api-gateway && npm install
	cd services/core-app && npm install
	cd services/test-runner && npm install
	cd services/integration-service && npm install
	@echo "Installing package dependencies..."
	cd packages/shared-types && npm install
	cd packages/shared-utils && npm install
	cd packages/test-data-loader && npm install
	cd packages/cucumber-helpers && npm install

build: ## Build all services
	@echo "Building shared packages..."
	cd packages/shared-types && npm run build
	cd packages/shared-utils && npm run build
	cd packages/test-data-loader && npm run build
	cd packages/cucumber-helpers && npm run build
	@echo "Building services..."
	cd services/api-gateway && npm run build
	cd services/core-app && npm run build
	cd services/test-runner && npm run build
	cd services/integration-service && npm run build

clean: ## Clean build artifacts and dependencies
	@echo "Cleaning build artifacts..."
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "*.tsbuildinfo" -type f -delete
	@echo "Clean complete"

dev: ## Start development environment
	docker-compose up -d postgres redis rabbitmq minio
	@echo "Development services started"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"
	@echo "RabbitMQ Management: http://localhost:15672"
	@echo "MinIO Console: http://localhost:9001"

up: ## Start all services with Docker Compose
	docker-compose up -d

down: ## Stop all Docker Compose services
	docker-compose down

logs: ## Show logs from all Docker Compose services
	docker-compose logs -f

test: ## Run all tests
	npm test

lint: ## Run linter on all code
	npm run lint

format: ## Format all code with Prettier
	npm run format

db-migrate: ## Run database migrations
	cd database && npm run migrate

db-seed: ## Seed database with test data
	cd database && npm run seed

db-reset: ## Reset database (drop and recreate)
	docker-compose down -v postgres
	docker-compose up -d postgres
	sleep 3
	$(MAKE) db-migrate
	$(MAKE) db-seed
