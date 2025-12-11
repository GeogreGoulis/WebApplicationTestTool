# Web Application Test Tool (WATT)

## Architecture Design & Development Roadmap

---

## 1. Executive Summary

This document outlines the architecture and development roadmap for a **Web Application Test Tool (WATT)** - a containerized platform for running automated test scripts against web applications (both Single Page Applications and Multi-Page Applications). The system is designed with microservices architecture, enabling seamless integration with DevOps tools (Azure DevOps, Jenkins, etc.) and deployment on container orchestration platforms (Kubernetes, Docker Swarm).

### Key Objectives

- Provide a user-friendly UI for test management and execution
- Enable CI/CD pipeline integration (ADO, Jenkins, GitLab CI)
- Maintain clean separation of concerns through containerized microservices
- Support horizontal scaling for parallel test execution
- Provide comprehensive reporting and analytics
- **Generate documentation and video recordings** based on user preference or API configuration
- Support **BDD testing** with Gherkin `.feature` files and `.json` data files

### Test Input Format

WATT uses a **Behavior-Driven Development (BDD)** approach:

| File Type | Purpose | Format |
|-----------|---------|--------|
| `.feature` | Test scenarios in Gherkin syntax | Human-readable test cases |
| `.json` | Test data consumed by feature files | Structured data for parameterization |

### Core Testing Framework

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Test Framework** | Playwright | Browser automation (fastest, modern) |
| **BDD Framework** | Cucumber | Gherkin parsing, step definitions |
| **Language** | TypeScript | Type safety, native JSON support |
| **Browsers** | Chrome, Firefox, Safari, Edge, Opera | Full cross-browser coverage |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KUBERNETES CLUSTER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   INGRESS   │    │   INGRESS   │    │   INGRESS   │    │   INGRESS   │  │
│  │   (UI/Web)  │    │    (API)    │    │ (Webhooks)  │    │  (Metrics)  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐  │
│  │             │    │             │    │             │    │             │  │
│  │   UI POD    │    │   API POD   │    │ INTEGRATION │    │  METRICS    │  │
│  │  (Frontend) │    │  (Gateway)  │    │     POD     │    │    POD      │  │
│  │             │    │             │    │             │    │             │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┼──────────────────┼──────────────────┘          │
│                            │                  │                              │
│                     ┌──────▼──────┐    ┌──────▼──────┐                      │
│                     │             │    │             │                      │
│                     │  CORE APP   │◄───│   MESSAGE   │                      │
│                     │    POD      │    │    QUEUE    │                      │
│                     │             │    │    POD      │                      │
│                     └──────┬──────┘    └─────────────┘                      │
│                            │                                                 │
│              ┌─────────────┼─────────────┐                                  │
│              │             │             │                                  │
│       ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐                          │
│       │             │ │         │ │             │                          │
│       │ TEST RUNNER │ │ TEST    │ │ TEST RUNNER │                          │
│       │   POD 1     │ │ RUNNER  │ │   POD N     │                          │
│       │             │ │ POD 2   │ │             │                          │
│       └─────────────┘ └─────────┘ └─────────────┘                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DATA LAYER                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │  DATABASE   │  │    CACHE    │  │   OBJECT    │  │    LOG     │  │   │
│  │  │    POD      │  │     POD     │  │   STORAGE   │  │  STORAGE   │  │   │
│  │  │ (PostgreSQL)│  │   (Redis)   │  │    POD      │  │    POD     │  │   │
│  │  │             │  │             │  │   (MinIO)   │  │  (Loki)    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Microservices Breakdown

### 3.1 UI Pod (Frontend Service)

**Purpose:** User interface for test management, execution monitoring, and reporting.

| Aspect | Details |
|--------|---------|
| Technology | React/Next.js or Vue.js |
| Container Base | Node.js Alpine |
| Replicas | 2-3 (load balanced) |
| Resources | 256Mi-512Mi RAM, 0.25-0.5 CPU |

**Features:**
- Dashboard with test execution overview
- Test script editor/uploader
- Real-time test execution monitoring
- Report visualization (charts, trends)
- User/team management
- Integration configuration UI

---

### 3.2 API Gateway Pod

**Purpose:** Central entry point for all API requests, handles authentication, rate limiting, and request routing.

| Aspect | Details |
|--------|---------|
| Technology | Node.js (Express/Fastify) or Go |
| Container Base | Node.js Alpine / Go Alpine |
| Replicas | 2-3 (load balanced) |
| Resources | 256Mi-512Mi RAM, 0.25-0.5 CPU |

**Responsibilities:**
- JWT authentication/authorization
- Rate limiting
- Request validation
- Route requests to appropriate services
- API versioning
- Request/response logging

---

### 3.3 Core Application Pod

**Purpose:** Business logic engine - manages test configurations, schedules, and orchestrates test execution.

| Aspect | Details |
|--------|---------|
| Technology | Python (FastAPI) or Node.js |
| Container Base | Python Slim / Node.js Alpine |
| Replicas | 2-3 |
| Resources | 512Mi-1Gi RAM, 0.5-1 CPU |

**Responsibilities:**
- Test suite management (CRUD operations)
- Test scheduling and triggering
- Test execution orchestration
- Result aggregation and storage
- Notification dispatch
- Configuration management

---

### 3.4 Test Runner Pods (Scalable Workers)

**Purpose:** Execute actual test scripts against target web applications.

| Aspect | Details |
|--------|---------|
| Technology | **Playwright + Cucumber (TypeScript)** |
| Container Base | `mcr.microsoft.com/playwright:latest` with Node.js |
| Replicas | 1-N (auto-scaled based on queue) |
| Resources | 1-2Gi RAM, 1-2 CPU per pod |

**Core Dependencies:**
```json
{
  "@playwright/test": "^1.40.x",
  "@cucumber/cucumber": "^10.x",
  "typescript": "^5.x",
  "ts-node": "^10.x"
}
```

**Supported Browsers:**
| Browser | Engine | Notes |
|---------|--------|-------|
| Chrome | Chromium | Primary browser |
| Firefox | Gecko | Full support |
| Safari | WebKit | Via Playwright WebKit |
| Edge | Chromium | Same engine as Chrome |
| Opera | Chromium | Same engine as Chrome |

**Responsibilities:**
- Parse and execute `.feature` files (Gherkin syntax)
- Load test data from `.json` files
- Execute browser automation via Playwright
- **Capture screenshots** on each step or on failure
- **Record video** of entire test execution (configurable)
- **Generate documentation** (step-by-step reports with screenshots)
- Report results back to Core App
- Support all major browser types
- Parallel test execution across browsers

**Artifact Generation (Configurable):**
| Artifact | Options | Storage |
|----------|---------|---------|
| Screenshots | `always` / `on-failure` / `never` | MinIO `test-artifacts` bucket |
| Video Recording | `always` / `on-failure` / `never` | MinIO `test-artifacts` bucket |
| Step Documentation | `enabled` / `disabled` | MinIO `reports` bucket |
| HTML Report | `always` | MinIO `reports` bucket |
| PDF Report | `on-request` | MinIO `reports` bucket |

**Scaling Strategy:**
- Horizontal Pod Autoscaler (HPA) based on queue length
- KEDA for event-driven scaling
- Scale to zero when idle (cost optimization)

---

### 3.5 Integration Pod (DevOps Bridge)

**Purpose:** Handle incoming webhooks and outbound notifications to DevOps tools.

| Aspect | Details |
|--------|---------|
| Technology | Node.js or Python |
| Container Base | Alpine-based |
| Replicas | 2 |
| Resources | 256Mi RAM, 0.25 CPU |

**Supported Integrations:**
- **Azure DevOps (ADO):** Pipeline triggers, work item updates, test result publishing
- **Jenkins:** Webhook triggers, build status updates
- **GitLab CI/CD:** Pipeline triggers, merge request comments
- **GitHub Actions:** Workflow dispatch, status checks
- **Slack/Teams:** Notifications
- **JIRA:** Issue creation on failures

**API Endpoints:**
```
POST /webhooks/ado          # ADO pipeline trigger
POST /webhooks/github       # GitHub webhook
POST /webhooks/gitlab       # GitLab webhook
POST /webhooks/jenkins      # Jenkins trigger
POST /api/notify/slack      # Slack notification
POST /api/notify/teams      # Teams notification
```

---

### 3.6 Message Queue Pod

**Purpose:** Async communication between services, test job queuing.

| Aspect | Details |
|--------|---------|
| Technology | RabbitMQ or Redis Streams |
| Container Base | Official RabbitMQ/Redis image |
| Replicas | 3 (clustered for HA) |
| Resources | 512Mi-1Gi RAM, 0.5 CPU |

**Queues:**
- `test.execution.pending` - Tests waiting to run
- `test.execution.running` - Currently executing tests
- `test.execution.completed` - Finished tests
- `notifications.outbound` - Pending notifications
- `integrations.events` - DevOps tool events

---

### 3.7 Database Pod

**Purpose:** Persistent storage for all application data.

| Aspect | Details |
|--------|---------|
| Technology | PostgreSQL |
| Container Base | Official PostgreSQL image |
| Replicas | 1 primary + 1-2 read replicas |
| Resources | 1-2Gi RAM, 1 CPU |
| Storage | Persistent Volume (50-100Gi) |

**Schema Categories:**
- Users & Authentication
- Test Suites & Scripts
- Execution History & Results
- Configurations & Schedules
- Integration Settings

---

### 3.8 Cache Pod

**Purpose:** Performance optimization, session storage, real-time data.

| Aspect | Details |
|--------|---------|
| Technology | Redis |
| Container Base | Official Redis Alpine |
| Replicas | 1 (or 3 for Redis Cluster) |
| Resources | 256Mi-512Mi RAM, 0.25 CPU |

**Usage:**
- Session storage
- API response caching
- Real-time test status
- Rate limiting counters
- Pub/Sub for real-time updates

---

### 3.9 Object Storage Pod

**Purpose:** Store test artifacts (screenshots, videos, reports).

| Aspect | Details |
|--------|---------|
| Technology | MinIO (S3-compatible) |
| Container Base | Official MinIO image |
| Replicas | 1 (or distributed mode) |
| Resources | 512Mi-1Gi RAM, 0.5 CPU |
| Storage | Persistent Volume (100Gi+) |

**Buckets:**
- `test-scripts` - Uploaded test files
- `test-artifacts` - Screenshots, videos
- `reports` - Generated PDF/HTML reports
- `logs` - Execution logs

---

### 3.10 Metrics & Monitoring Pod

**Purpose:** Observability stack for the entire platform.

| Aspect | Details |
|--------|---------|
| Technology | Prometheus + Grafana |
| Container Base | Official images |
| Replicas | 1 each |
| Resources | 512Mi-1Gi RAM each |

**Dashboards:**
- Test execution metrics
- System health
- Queue depths
- Error rates
- Response times

---

## 4. Technology Stack Summary

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Test Execution** | **Playwright + Cucumber** | Fastest execution, BDD support, cross-browser |
| **Test Language** | **TypeScript** | Type safety, native JSON, maintainability |
| Frontend | React/Next.js | Modern, component-based, SSR support |
| API Gateway | Node.js/Express (TypeScript) | Consistent stack, lightweight |
| Core Backend | Node.js/Fastify (TypeScript) | Consistent stack, async support |
| Message Queue | RabbitMQ | Reliable, feature-rich, good tooling |
| Database | PostgreSQL | ACID compliance, JSON support, reliability |
| Cache | Redis | Fast, versatile, pub/sub support |
| Object Storage | MinIO | S3-compatible, self-hosted |
| Container Runtime | Docker | Industry standard |
| Orchestration | Kubernetes | Scalability, self-healing, mature ecosystem |
| CI/CD | Azure DevOps / GitHub Actions | Integration requirement |
| Monitoring | Prometheus + Grafana | Industry standard, extensive integrations |
| Logging | Loki + Promtail | Lightweight, integrates with Grafana |
| **Report Generation** | **Playwright Reporter + PDFKit** | HTML/PDF reports with screenshots |
| **Video Recording** | **Playwright Native** | Built-in video capture |

### Why This Stack?

| Decision | Rationale |
|----------|-----------|
| **Playwright over Selenium** | 2x faster execution, auto-waiting, native video recording |
| **Cucumber for BDD** | Industry standard for `.feature` files, excellent TypeScript support |
| **TypeScript everywhere** | Type safety, consistent codebase, native JSON handling |
| **All browsers via Playwright** | Chrome, Firefox, Safari, Edge, Opera all supported natively |

---

## 4.1 Self-Healing Test Capability

WATT includes an **AI-powered self-healing** feature that automatically adapts tests when UI elements change, reducing test maintenance by up to 70%.

### How Self-Healing Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SELF-HEALING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DETECTION                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Test Step: Click login button                                       │   │
│  │  Original Locator: #login-btn                                        │   │
│  │  Result: ELEMENT NOT FOUND ❌                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  2. ANALYSIS                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Self-Healing Engine analyzes the page:                              │   │
│  │  • Search by similar attributes (class, name, aria-label)           │   │
│  │  • Search by text content ("Login", "Sign In")                       │   │
│  │  • Search by position/structure (same parent, sibling)              │   │
│  │  • Search by visual similarity (button shape, color)                │   │
│  │  • AI model scores potential matches                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  3. ADAPTATION                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Best Match Found: button.submit-btn (confidence: 94%)               │   │
│  │  Action: Use alternative locator and continue test                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  4. VALIDATION & LEARNING                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Execute action with new locator                                   │   │
│  │  • Verify test continues successfully                                │   │
│  │  • Log healing event for review                                      │   │
│  │  • Suggest permanent locator update                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Self-Healing Strategy Layers

| Layer | Strategy | Description |
|-------|----------|-------------|
| 1 | **Multiple Locators** | Store backup locators (ID, CSS, XPath, text) |
| 2 | **Attribute Matching** | Find elements with similar attributes |
| 3 | **Text Content** | Match by visible text or aria-label |
| 4 | **DOM Structure** | Find by parent/child/sibling relationships |
| 5 | **Visual AI** | ML-based visual element recognition |

### Self-Healing Configuration

```json
{
  "selfHealing": {
    "enabled": true,
    "confidenceThreshold": 0.85,
    "strategies": ["multiLocator", "attribute", "text", "structure"],
    "autoUpdateLocators": false,
    "notifyOnHeal": true,
    "maxHealingAttempts": 3
  }
}
```

### Healing Report

When self-healing occurs, WATT generates a detailed report:

```json
{
  "healingEvent": {
    "timestamp": "2024-12-10T14:30:00Z",
    "testFile": "login.feature",
    "scenario": "Successful login with valid credentials",
    "step": "When I click the login button",
    "originalLocator": "#login-btn",
    "healedLocator": "button.submit-btn",
    "confidence": 0.94,
    "strategy": "attribute",
    "recommendation": "Update step definition to use: button[type='submit']"
  }
}
```

### Benefits

| Benefit | Impact |
|---------|--------|
| **Reduced Maintenance** | Up to 70% less time fixing broken tests |
| **Increased Stability** | Tests survive minor UI changes |
| **Faster Feedback** | No false failures blocking CI/CD |
| **Learning System** | Improves over time with usage data |

---

## 5. DevOps Integration Details

### 5.1 Azure DevOps (ADO) Integration

```yaml
# Example ADO Pipeline Integration
trigger:
  - main

stages:
  - stage: Test
    jobs:
      - job: RunWATTTests
        steps:
          - task: InvokeRESTAPI@1
            inputs:
              connectionType: 'connectedServiceName'
              serviceConnection: 'WATT-Connection'
              method: 'POST'
              urlSuffix: '/api/v1/tests/execute'
              body: |
                {
                  "suiteId": "$(TestSuiteId)",
                  "environment": "$(Environment)",
                  "callback": "$(System.CollectionUri)$(System.TeamProject)/_apis/test/runs"
                }
```

### 5.2 Webhook Payload Structure

```json
{
  "event": "pipeline.triggered",
  "source": "azure-devops",
  "payload": {
    "pipelineId": "123",
    "buildId": "456",
    "branch": "main",
    "commit": "abc123",
    "triggeredBy": "user@example.com"
  },
  "testConfig": {
    "suiteId": "suite-001",
    "environment": "staging",
    "browsers": ["chrome", "firefox"],
    "parallel": 4
  }
}
```

---

## 6. Docker/Kubernetes Configuration

### 6.1 Namespace Structure

```
watt-system/
├── watt-frontend      # UI components
├── watt-backend       # Core services
├── watt-workers       # Test runners
├── watt-data          # Databases, caches
├── watt-monitoring    # Observability
└── watt-integrations  # DevOps bridges
```

### 6.2 Resource Quotas (Example)

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: watt-backend-quota
  namespace: watt-backend
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
```

### 6.3 Helm Chart Structure

```
watt-helm/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── api-gateway/
│   ├── core-app/
│   ├── test-runners/
│   ├── integrations/
│   ├── database/
│   ├── redis/
│   ├── rabbitmq/
│   └── monitoring/
└── charts/
    ├── postgresql/
    ├── redis/
    └── rabbitmq/
```

---

## 7. Development Roadmap

### Phase 1: Foundation (Weeks 1-4)

#### Week 1-2: Project Setup & Infrastructure
- [ ] Initialize monorepo structure
- [ ] Set up development environment (Docker Compose for local dev)
- [ ] Create base Dockerfiles for each service
- [ ] Set up CI/CD pipeline skeleton
- [ ] Configure linting, testing frameworks
- [ ] Set up local Kubernetes (minikube/kind) for testing

#### Week 3-4: Database & Core Models
- [ ] Design and implement database schema
- [ ] Create database migrations
- [ ] Implement core data models
- [ ] Set up Redis caching layer
- [ ] Configure RabbitMQ with required queues
- [ ] Implement basic health check endpoints

**Deliverables:**
- Working local development environment
- Database schema implemented
- Base container images built
- CI/CD pipeline for builds

---

### Phase 2: Core Services (Weeks 5-8)

#### Week 5-6: API Gateway & Authentication
- [ ] Implement API Gateway service
- [ ] JWT authentication system
- [ ] User registration/login endpoints
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting middleware
- [ ] API documentation (OpenAPI/Swagger)

#### Week 7-8: Core Application Service
- [ ] Test suite CRUD operations
- [ ] Test script upload/management
- [ ] Test scheduling system
- [ ] Execution orchestration logic
- [ ] Result aggregation service
- [ ] WebSocket for real-time updates

**Deliverables:**
- Functional API Gateway
- User authentication working
- Test management APIs complete
- Real-time status updates

---

### Phase 3: Test Execution Engine (Weeks 9-12)

#### Week 9-10: Test Runner Implementation
- [ ] Create test runner base image with browsers
- [ ] Implement Playwright/Selenium wrapper
- [ ] Message queue consumer for test jobs
- [ ] Screenshot/video capture on failure
- [ ] Result reporting back to Core App
- [ ] Support for multiple test frameworks

#### Week 11-12: Scaling & Orchestration
- [ ] Implement Horizontal Pod Autoscaler
- [ ] Configure KEDA for queue-based scaling
- [ ] Parallel test execution support
- [ ] Resource optimization
- [ ] Retry logic for flaky tests
- [ ] Test timeout handling

**Deliverables:**
- Working test execution pipeline
- Auto-scaling test runners
- Artifact storage (screenshots, videos)
- Parallel execution support

---

### Phase 4: Frontend Development (Weeks 13-16)

#### Week 13-14: Core UI Components
- [ ] Project scaffolding (Next.js/React)
- [ ] Authentication pages (login, register)
- [ ] Dashboard layout and navigation
- [ ] Test suite management pages
- [ ] Test script editor/uploader

#### Week 15-16: Advanced UI Features
- [ ] Real-time test execution view
- [ ] Test results and history pages
- [ ] Report generation and viewing
- [ ] User/team management UI
- [ ] Settings and configuration pages
- [ ] Responsive design implementation

**Deliverables:**
- Complete frontend application
- Real-time execution monitoring
- Report viewing capabilities
- User management interface

---

### Phase 5: DevOps Integrations (Weeks 17-20)

#### Week 17-18: ADO & CI/CD Integration
- [ ] Azure DevOps webhook handler
- [ ] ADO test result publishing
- [ ] Pipeline trigger endpoints
- [ ] GitHub Actions integration
- [ ] GitLab CI integration
- [ ] Jenkins webhook support

#### Week 19-20: Notifications & Reporting
- [ ] Slack notification service
- [ ] Microsoft Teams integration
- [ ] Email notifications
- [ ] JIRA issue creation
- [ ] PDF report generation
- [ ] Scheduled report delivery

**Deliverables:**
- Full ADO integration
- Multi-platform CI/CD support
- Notification system working
- Automated reporting

---

### Phase 6: Production Readiness (Weeks 21-24)

#### Week 21-22: Monitoring & Observability
- [ ] Prometheus metrics for all services
- [ ] Grafana dashboards
- [ ] Loki log aggregation
- [ ] Alerting rules configuration
- [ ] Distributed tracing (Jaeger/Zipkin)
- [ ] Error tracking (Sentry)

#### Week 23-24: Security & Hardening
- [ ] Security audit and fixes
- [ ] Secrets management (Vault/Sealed Secrets)
- [ ] Network policies
- [ ] Pod security policies
- [ ] Backup and disaster recovery
- [ ] Load testing and optimization

**Deliverables:**
- Complete observability stack
- Security hardened deployment
- Backup procedures documented
- Performance benchmarks

---

### Phase 7: Documentation & Launch (Weeks 25-26)

- [ ] User documentation
- [ ] API documentation
- [ ] Deployment guides
- [ ] Runbook for operations
- [ ] Training materials
- [ ] Production deployment

---

## 8. Repository Structure

```
WebApplicationTestTool/
├── README.md
├── ARCHITECTURE_AND_ROADMAP.md
├── TECHNICAL_ARCHITECTURE_SCHEMA.md
├── MARKET_COMPARISON.md
├── docker-compose.yml              # Local development
├── docker-compose.override.yml     # Local overrides
├── Makefile                        # Common commands
│
├── services/
│   ├── frontend/                   # React/Next.js UI
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   ├── api-gateway/                # API Gateway service (TypeScript)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   ├── core-app/                   # Core business logic (TypeScript)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   ├── test-runner/                # Test execution workers (Playwright + Cucumber)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── cucumber.json           # Cucumber configuration
│   │   └── src/
│   │       ├── executor/           # Test execution engine
│   │       ├── self-healing/       # Self-healing module
│   │       ├── reporters/          # Report generators
│   │       └── artifacts/          # Screenshot/video handlers
│   │
│   ├── integration-service/        # DevOps integrations (TypeScript)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │
│   └── report-generator/           # Report generation service
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── html/               # HTML report templates
│           ├── pdf/                # PDF generation (PDFKit)
│           └── video/              # Video processing
│
├── packages/                       # Shared packages (monorepo)
│   ├── shared-types/               # TypeScript types shared across services
│   ├── cucumber-helpers/           # Cucumber step definition helpers
│   ├── self-healing-engine/        # Self-healing logic
│   └── test-data-loader/           # JSON data loading utilities
│
├── schemas/                        # JSON Schemas for validation
│   ├── test-data.schema.json       # Schema for .json test data files
│   ├── execution-config.schema.json
│   └── api-payloads.schema.json
│
├── infrastructure/
│   ├── kubernetes/
│   │   ├── base/                   # Base Kustomize configs
│   │   ├── overlays/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── helm/                   # Helm charts
│   │
│   ├── terraform/                  # Cloud infrastructure
│   │   ├── modules/
│   │   └── environments/
│   │
│   └── scripts/                    # Deployment scripts
│
├── database/
│   ├── migrations/                 # Database migrations
│   ├── seeds/                      # Seed data
│   └── schema/                     # Schema documentation
│
├── docs/
│   ├── api/                        # API documentation
│   ├── user-guide/                 # User documentation
│   ├── test-authoring/             # How to write .feature and .json files
│   └── operations/                 # Runbooks
│
├── examples/                       # Example test projects
│   └── sample-test-suite/
│       ├── features/               # Example .feature files
│       │   ├── login.feature
│       │   └── checkout.feature
│       ├── data/                   # Example .json data files
│       │   ├── users.json
│       │   └── products.json
│       └── step-definitions/       # Example step definitions
│           └── steps.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── .github/                        # GitHub Actions (if using)
    └── workflows/
```

---

## 8.1 Video Recording & Documentation Generation

WATT provides comprehensive artifact generation capabilities, configurable via UI or API.

### Artifact Types

| Artifact | Format | Description |
|----------|--------|-------------|
| **Video Recording** | WebM/MP4 | Full test execution recording |
| **Screenshots** | PNG | Per-step or on-failure captures |
| **HTML Report** | HTML | Interactive test results with embedded media |
| **PDF Report** | PDF | Printable documentation with screenshots |
| **Step Documentation** | Markdown/HTML | Human-readable test documentation |

### Configuration Options

**Via API Request:**
```json
{
  "executionConfig": {
    "suiteId": "suite-123",
    "browsers": ["chrome", "firefox"],
    "artifacts": {
      "video": {
        "enabled": true,
        "mode": "always",
        "format": "webm",
        "quality": "high"
      },
      "screenshots": {
        "enabled": true,
        "mode": "on-failure",
        "fullPage": true
      },
      "reports": {
        "html": true,
        "pdf": true,
        "includeVideos": true,
        "includeScreenshots": true
      },
      "documentation": {
        "generateStepDocs": true,
        "format": "html"
      }
    }
  }
}
```

**Via UI Preferences:**

Users can configure default artifact settings in their profile:
- Toggle video recording on/off
- Select screenshot capture mode
- Choose report formats (HTML, PDF, both)
- Enable/disable step documentation

### Video Recording Details

| Setting | Options | Default |
|---------|---------|---------|
| **Mode** | `always`, `on-failure`, `never` | `on-failure` |
| **Format** | `webm`, `mp4` | `webm` |
| **Quality** | `low`, `medium`, `high` | `medium` |
| **Size** | `viewport`, `full-page` | `viewport` |
| **Retention** | 7, 14, 30, 90 days | 30 days |

### Report Generation

**HTML Report Features:**
- Interactive test results tree
- Embedded screenshots (expandable)
- Embedded video playback
- Filter by status (passed/failed/skipped)
- Duration metrics and trends
- Self-healing events highlighted

**PDF Report Features:**
- Executive summary with pass/fail metrics
- Detailed step-by-step results
- Screenshots embedded inline
- QR code links to video recordings
- Suitable for compliance/audit purposes

### Storage & Retention

All artifacts are stored in MinIO (S3-compatible):

```
minio/
├── test-artifacts/
│   ├── {execution-id}/
│   │   ├── videos/
│   │   │   ├── chrome-scenario-1.webm
│   │   │   └── firefox-scenario-1.webm
│   │   ├── screenshots/
│   │   │   ├── step-1-login-page.png
│   │   │   ├── step-2-enter-credentials.png
│   │   │   └── failure-invalid-login.png
│   │   └── traces/
│   │       └── trace.zip
│   │
├── reports/
│   ├── {execution-id}/
│   │   ├── report.html
│   │   ├── report.pdf
│   │   └── documentation.html
```

### API Endpoints for Artifacts

```
GET  /api/v1/executions/{id}/artifacts          # List all artifacts
GET  /api/v1/executions/{id}/video              # Download video
GET  /api/v1/executions/{id}/screenshots        # Download screenshots (zip)
GET  /api/v1/executions/{id}/report/html        # Download HTML report
GET  /api/v1/executions/{id}/report/pdf         # Download PDF report
POST /api/v1/executions/{id}/report/generate    # Trigger report generation
```

---

## 9. Key Design Decisions & Trade-offs

### 9.1 Monorepo vs Polyrepo
**Decision:** Monorepo
**Rationale:**
- Easier dependency management
- Atomic commits across services
- Simplified CI/CD
- Better code sharing

### 9.2 Message Queue Choice
**Decision:** RabbitMQ over Kafka
**Rationale:**
- Simpler to operate at smaller scale
- Better for task queues (vs event streaming)
- Lower resource requirements
- Sufficient for expected throughput

### 9.3 Test Runner Scaling Strategy
**Decision:** Queue-based autoscaling with KEDA
**Rationale:**
- Scale to zero when idle (cost savings)
- Responsive to actual demand
- Simple to configure
- Works well with message queues

### 9.4 Database Choice
**Decision:** PostgreSQL over MongoDB
**Rationale:**
- Strong consistency requirements
- Complex queries for reporting
- Mature ecosystem
- JSON support for flexible schemas where needed

---

## 10. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Browser compatibility issues in test runners | High | Medium | Thorough testing, multiple browser support |
| Database performance under load | High | Low | Proper indexing, read replicas, caching |
| Message queue bottleneck | Medium | Low | Monitoring, horizontal scaling |
| Integration API changes (ADO, etc.) | Medium | Medium | Abstraction layer, version pinning |
| Container resource exhaustion | High | Medium | Resource limits, monitoring, autoscaling |
| Security vulnerabilities | Critical | Low | Regular audits, dependency scanning |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Test execution time (avg) | < 30s for unit tests |
| API response time (p95) | < 200ms |
| System uptime | 99.5% |
| Test runner scale-up time | < 60s |
| Concurrent test capacity | 100+ parallel tests |
| Report generation time | < 10s |

---

## 12. Next Steps

1. **Review this document** and provide feedback on architecture decisions
2. **Prioritize features** based on MVP requirements
3. **Identify team members** and assign responsibilities
4. **Set up development environment** (Phase 1, Week 1)
5. **Begin implementation** following the roadmap

---

## 13. Open Questions for Discussion

1. **Test Framework Support:** Which test frameworks should be prioritized? (Playwright, Selenium, Cypress, pytest, etc.)
2. **Multi-tenancy:** Should the platform support multiple isolated tenants?
3. **Cloud Provider:** Primary cloud target (Azure, AWS, GCP)?
4. **Authentication:** OAuth/SSO integration requirements?
5. **Compliance:** Any specific compliance requirements (SOC2, GDPR)?
6. **Existing Infrastructure:** Any existing systems to integrate with?

---

*Document Version: 1.0*
*Created: December 2024*
*Last Updated: December 2024*
