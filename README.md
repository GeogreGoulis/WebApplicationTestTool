# WATT - Web Application Test Tool

A containerized, Kubernetes-native platform for automated web application testing using Playwright, Cucumber, and BDD methodology.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- Docker and Docker Compose
- PostgreSQL 16
- Make (optional, for convenience)

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start infrastructure services:**
   ```bash
   make dev
   # Or: docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   cd database && npm install
   npm run migrate
   ```

5. **Build shared packages:**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
WebApplicationTestTool/
├── packages/                    # Shared packages (monorepo)
│   ├── shared-types/           # TypeScript type definitions
│   ├── shared-utils/           # Utility functions (logger, crypto, etc.)
│   ├── test-data-loader/       # JSON data loading for tests
│   └── cucumber-helpers/       # Cucumber/Playwright utilities
│
├── services/                    # Microservices (to be implemented)
│   ├── api-gateway/            # API Gateway service
│   ├── core-app/               # Core application logic
│   ├── test-runner/            # Test execution workers
│   └── integration-service/    # DevOps integrations
│
├── database/                    # Database migrations and seeds
│   ├── migrations/             # PostgreSQL migrations
│   ├── seeds/                  # Seed data
│   └── init/                   # Initial SQL scripts
│
├── examples/                    # Example test suites
│   └── sample-test-suite/      # Working Playwright + Cucumber example
│
├── infrastructure/              # Deployment configs (to be added)
│   ├── kubernetes/             # K8s manifests
│   └── terraform/              # Infrastructure as code
│
└── docs/                        # Documentation
    ├── ARCHITECTURE_AND_ROADMAP.md
    ├── TECHNICAL_ARCHITECTURE_SCHEMA.md
    └── MARKET_COMPARISON.md
```

## 🛠️ Development

### Available Commands

```bash
# Install all dependencies
make install

# Build all packages and services
make build

# Start development environment (databases only)
make dev

# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Run tests
make test

# Lint code
make lint

# Format code
make format

# Clean build artifacts
make clean
```

### Working with Monorepo

This project uses npm workspaces for monorepo management:

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run scripts in specific workspace
npm run build --workspace=packages/shared-types

# Add dependency to specific package
npm install <package> --workspace=packages/shared-utils
```

## 🗄️ Infrastructure Services

The following services run via Docker Compose:

| Service | Port | Purpose | Management UI |
|---------|------|---------|---------------|
| PostgreSQL | 5432 | Main database | - |
| Redis | 6379 | Cache & sessions | - |
| RabbitMQ | 5672 | Message queue | http://localhost:15672 |
| MinIO | 9000 | Object storage | http://localhost:9001 |

### Default Credentials (Development)

- **PostgreSQL:** `watt` / `watt_dev_password`
- **RabbitMQ:** `watt` / `watt_dev_password`
- **MinIO:** `watt` / `watt_dev_password`

⚠️ **Never use these in production!**

## 🧪 Running Example Tests

A complete working example is available in `examples/sample-test-suite/`:

```bash
cd examples/sample-test-suite
npm test
```

This demonstrates:
- ✅ Cucumber + Playwright integration
- ✅ BDD with `.feature` files
- ✅ JSON data loading
- ✅ Page Object Model
- ✅ Self-healing locators

## 📊 Database

### Running Migrations

```bash
cd database
npm run migrate          # Run all pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:create <name>  # Create new migration
```

### Database Schema

- **organizations** - Multi-tenant organization structure
- **teams** - Team management within organizations
- **users** - User accounts with RBAC
- **test_suites** - Test suite definitions
- **test_scripts** - Individual test files
- **test_environments** - Environment configurations
- **test_executions** - Test execution records
- **test_results** - Individual test results
- **test_artifacts** - Screenshots, videos, traces
- **test_logs** - Execution logs
- **integrations** - DevOps tool integrations

## 🏗️ Architecture

WATT follows a microservices architecture:

- **API Gateway** - Authentication, routing, rate limiting
- **Core App** - Business logic, orchestration
- **Test Runners** - Playwright/Cucumber execution (auto-scaled)
- **Integration Service** - DevOps webhooks and notifications
- **Frontend** - React/Next.js dashboard

See [ARCHITECTURE_AND_ROADMAP.md](ARCHITECTURE_AND_ROADMAP.md) for detailed architecture diagrams.

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Test Execution** | Playwright + Cucumber | Browser automation + BDD |
| **Language** | TypeScript | Type safety across all services |
| **API** | Express/Fastify | RESTful APIs |
| **Database** | PostgreSQL | ACID-compliant data storage |
| **Cache** | Redis | Sessions, caching |
| **Queue** | RabbitMQ | Async job processing |
| **Storage** | MinIO | S3-compatible artifact storage |
| **Orchestration** | Kubernetes | Container orchestration |
| **Monitoring** | Prometheus + Grafana | Metrics and observability |

## 📝 Development Roadmap

### ✅ Phase 0: Foundation (Current)
- [x] Monorepo structure
- [x] TypeScript configuration
- [x] Shared packages (types, utils, test-data-loader, cucumber-helpers)
- [x] Docker Compose environment
- [x] Database schema and migrations
- [x] Development tooling (ESLint, Prettier, Makefile)

### 🚧 Phase 1: Core Backend Services (Next)
- [ ] API Gateway with JWT authentication
- [ ] Core Application service
- [ ] RabbitMQ integration
- [ ] Basic CRUD operations

### 📅 Phase 2: Test Execution Engine
- [ ] Test Runner service
- [ ] MinIO integration
- [ ] Artifact capture (screenshots, videos)
- [ ] Result reporting

### 📅 Phase 3: Frontend Dashboard
- [ ] React/Next.js application
- [ ] Authentication UI
- [ ] Test suite management
- [ ] Real-time execution monitoring

### 📅 Phase 4: DevOps Integration
- [ ] Azure DevOps integration
- [ ] GitHub/GitLab webhooks
- [ ] Slack/Teams notifications
- [ ] JIRA integration

### 📅 Phase 5: Production Readiness
- [ ] Kubernetes manifests
- [ ] Helm charts
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Auto-scaling with KEDA

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Format code: `npm run format`
6. Submit a pull request

## 📄 License

MIT

## 📚 Documentation

- [Architecture & Roadmap](ARCHITECTURE_AND_ROADMAP.md)
- [Technical Architecture Schema](TECHNICAL_ARCHITECTURE_SCHEMA.md)
- [Market Comparison](MARKET_COMPARISON.md)
- [Example Tests](examples/README.md)

## 🆘 Support

For questions or issues:
1. Check the documentation in `/docs`
2. Review example tests in `/examples`
3. Open an issue on GitHub

---

**Built with ❤️ by the WATT Team**
