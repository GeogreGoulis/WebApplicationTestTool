# Phase 2: Test Execution Engine - Implementation Summary

## Overview

Phase 2 completes the **Test Execution Engine** for the WATT platform. This service consumes test execution jobs from RabbitMQ, executes Playwright-driven browser tests, captures artifacts (screenshots, videos), and stores them in MinIO.

## Components Implemented

### 1. Test Runner Service (`services/test-runner/`)

The Test Runner is a microservice that:
- Consumes test execution jobs from RabbitMQ
- Launches browsers (Chromium, Firefox, WebKit) using Playwright
- Executes test scripts
- Captures screenshots and video recordings
- Uploads artifacts to MinIO object storage
- Updates execution status and results in PostgreSQL

#### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Test Runner Service                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐        ┌─────────────────────┐           │
│  │   Index.ts   │        │  TestExecution      │           │
│  │              │───────▶│  Service            │           │
│  │ - Health     │        │ - Execute tests     │           │
│  │ - Ready      │        │ - Manage results    │           │
│  │ - Graceful   │        │ - Upload artifacts  │           │
│  │   shutdown   │        └─────────────────────┘           │
│  └──────────────┘                  │                        │
│                                    │                        │
│  ┌──────────────┐     ┌────────────▼──────┐               │
│  │  RabbitMQ    │     │  Playwright       │               │
│  │  Consumer    │     │  Executor         │               │
│  │              │     │                   │               │
│  │ - Consume    │     │ - Launch browser  │               │
│  │   jobs       │     │ - Create context  │               │
│  │ - Publish    │     │ - Execute tests   │               │
│  │   results    │     │ - Capture         │               │
│  └──────────────┘     │   screenshots     │               │
│                       │ - Record video    │               │
│  ┌──────────────┐     └───────────────────┘               │
│  │   MinIO      │                                          │
│  │   Storage    │                                          │
│  │              │                                          │
│  │ - Upload     │                                          │
│  │   files      │                                          │
│  │ - Generate   │                                          │
│  │   URLs       │                                          │
│  └──────────────┘                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2. Key Files Created/Modified

#### Service Entry Point
- **`src/index.ts`** (73 lines)
  - Express server with health and readiness endpoints
  - RabbitMQ consumer initialization
  - MinIO bucket setup
  - Job consumption and processing
  - Graceful shutdown handling

#### Test Execution Service
- **`src/services/testExecution.ts`** (262 lines)
  - `TestExecutionService` class
  - Job execution orchestration
  - Browser-based test execution
  - Result persistence to database
  - Artifact upload to MinIO
  - Execution status management

#### Playwright Integration
- **`src/executor/playwright.ts`** (269 lines)
  - `PlaywrightExecutor` class
  - Multi-browser support (Chromium, Firefox, WebKit)
  - Context creation with video recording
  - Screenshot capture (on-demand and on-failure)
  - Artifact directory management
  - Browser lifecycle management

#### Storage Integrations
- **`src/storage/rabbitmq.ts`** (137 lines)
  - `RabbitMQConsumer` class
  - Queue connection and management
  - Job consumption with prefetch control
  - Result publication
  - Auto-reconnection with backoff

- **`src/storage/minio.ts`** (152 lines)
  - `MinioStorage` class
  - S3-compatible object storage client
  - File and buffer uploads
  - Pre-signed URL generation
  - Content-type detection
  - Bucket management

#### Configuration & Infrastructure
- **`src/config.ts`** (47 lines)
  - Environment variable configuration
  - Playwright settings (headless, timeout, video, screenshots)
  - RabbitMQ and MinIO connection details
  - Concurrency limits

- **`src/database.ts`** (27 lines)
  - PostgreSQL connection pool
  - Connection testing
  - Error handling

- **`Dockerfile`** (58 lines)
  - Multi-stage build (Node 20 + Playwright)
  - Production-optimized image
  - Health checks
  - Playwright browser installation

- **`docker-compose.yml`** (Updated)
  - Added test-runner service configuration
  - Port 3200 exposed
  - Environment variables for all integrations
  - Volume for test artifacts

## Data Flow

### 1. Job Consumption

```
RabbitMQ Queue              Test Runner
┌───────────────┐          ┌──────────────────┐
│               │          │                  │
│ test-         │          │  RabbitMQ        │
│ execution-    │─────────▶│  Consumer        │
│ queue         │          │                  │
│               │          └──────────────────┘
│ Job Format:   │                  │
│ {             │                  ▼
│   id,         │          ┌──────────────────┐
│   suiteId,    │          │  Test Execution  │
│   envId,      │          │  Service         │
│   browsers,   │          │                  │
│   scripts[]   │          │  - Parse job     │
│ }             │          │  - Validate      │
└───────────────┘          │  - Execute       │
                           └──────────────────┘
```

### 2. Test Execution

```
Test Execution Service
│
├─▶ Get Environment (DB query)
│   ├─ base_url
│   └─ variables (JSON)
│
├─▶ For each browser type:
│   │
│   ├─▶ Launch Browser (Playwright)
│   │   └─ Chromium / Firefox / WebKit
│   │
│   ├─▶ For each test script:
│   │   │
│   │   ├─▶ Create Context
│   │   │   ├─ Video recording setup
│   │   │   └─ Screenshot config
│   │   │
│   │   ├─▶ Execute Test
│   │   │   ├─ Navigate to base_url
│   │   │   ├─ Run test steps
│   │   │   ├─ Capture screenshots
│   │   │   └─ Handle failures
│   │   │
│   │   ├─▶ Save Result (DB)
│   │   │   ├─ test_results table
│   │   │   ├─ status, duration
│   │   │   └─ error details
│   │   │
│   │   └─▶ Upload Artifacts (MinIO)
│   │       ├─ Screenshots
│   │       ├─ Videos
│   │       └─ Save artifact records (DB)
│   │
│   └─▶ Close Browser
│
└─▶ Update Execution Status (DB)
    ├─ completed / failed
    ├─ completed_at timestamp
    └─ total duration
```

### 3. Artifact Storage

```
Local Filesystem          MinIO Object Storage        Database
┌──────────────┐         ┌─────────────────┐        ┌───────────────┐
│              │         │                 │        │               │
│ test-        │         │ Bucket:         │        │ test_         │
│ artifacts/   │         │ test-artifacts  │        │ artifacts     │
│              │         │                 │        │               │
│ ├─ {execId}/ │────────▶│ /{execId}/      │───────▶│ - id          │
│    ├─ screenshots/      │   /screenshots/│        │ - result_id   │
│    │  ├─ 1.png│────────▶│      /1.png    │───────▶│ - file_path   │
│    │  └─ 2.png│────────▶│      /2.png    │───────▶│ - size_bytes  │
│    └─ videos/  │        │   /videos/     │        │ - mime_type   │
│       └─ test.webm──────▶│      /test.webm│───────▶│ - created_at  │
│              │         │                 │        │               │
└──────────────┘         └─────────────────┘        └───────────────┘
```

## Configuration

### Environment Variables

```bash
# Service
PORT=3200
NODE_ENV=development

# Database
DATABASE_URL=postgresql://watt:watt_dev_password@postgres:5432/watt

# RabbitMQ
RABBITMQ_URL=amqp://watt:watt_dev_password@rabbitmq:5672
QUEUE_TEST_EXECUTION=test-execution-queue
QUEUE_TEST_RESULTS=test-results-queue

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=watt
MINIO_SECRET_KEY=watt_dev_password
MINIO_USE_SSL=false
MINIO_BUCKET_ARTIFACTS=test-artifacts
MINIO_BUCKET_SCRIPTS=test-scripts
MINIO_BUCKET_REPORTS=reports

# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=0
PLAYWRIGHT_TIMEOUT=30000
VIDEO_RECORDING=true
SCREENSHOT_ON_FAILURE=true

# Concurrency
MAX_CONCURRENT_TESTS=3
```

## API Endpoints

### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "service": "test-runner",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Readiness Check
```
GET /ready

Response:
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Database Schema Integration

The Test Runner interacts with these tables:

### test_executions
```sql
- id (uuid)
- suite_id (uuid)
- environment_id (uuid)
- status (enum: pending, running, completed, failed, cancelled)
- started_at (timestamp)
- completed_at (timestamp)
- duration (integer) -- milliseconds
```

### test_results
```sql
- id (uuid)
- execution_id (uuid)
- script_id (uuid)
- browser (enum: chromium, firefox, webkit, edge, safari)
- status (enum: passed, failed, skipped)
- duration (integer)
- error_message (text)
- stack_trace (text)
- retry_attempt (integer)
```

### test_artifacts
```sql
- id (uuid)
- result_id (uuid)
- execution_id (uuid)
- type (enum: screenshot, video, trace, log, report)
- file_path (text) -- MinIO object path
- file_name (varchar)
- size_bytes (bigint)
- mime_type (varchar)
- metadata (jsonb)
```

### test_environments
```sql
- id (uuid)
- name (varchar)
- base_url (text)
- variables (jsonb) -- environment-specific data
```

## Job Message Format

### Execution Job (from Core App)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "test-execution",
  "suiteId": "660e8400-e29b-41d4-a716-446655440001",
  "environmentId": "770e8400-e29b-41d4-a716-446655440002",
  "browsers": ["chromium", "firefox"],
  "parallelCount": 1,
  "scripts": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Login Test",
      "filePath": "/path/to/feature/login.feature",
      "framework": "cucumber",
      "timeout": 30000,
      "retryCount": 2,
      "tags": ["@smoke", "@login"]
    }
  ],
  "metadata": {
    "triggeredBy": "user-id",
    "priority": "high"
  },
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### Result Message (to Core App)
```json
{
  "executionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "completedAt": "2024-01-15T10:05:30.000Z",
  "duration": 330000,
  "results": [
    {
      "scriptId": "880e8400-e29b-41d4-a716-446655440003",
      "browser": "chromium",
      "status": "passed",
      "duration": 15000,
      "screenshots": ["550e.../screenshots/step-1.png"],
      "videoPath": "550e.../videos/test.webm"
    }
  ],
  "totalTests": 2,
  "passed": 2,
  "failed": 0
}
```

## Features

### ✅ Multi-Browser Support
- Chromium
- Firefox
- WebKit
- Configured via job specification

### ✅ Artifact Capture
- **Screenshots**: Captured on-demand and on failure
- **Videos**: Full test execution recording (WebM format)
- **Automatic Upload**: All artifacts uploaded to MinIO
- **Database Tracking**: Artifact metadata stored in PostgreSQL

### ✅ Concurrent Execution
- Configurable concurrency limit (default: 3)
- RabbitMQ prefetch control
- Resource-aware job consumption

### ✅ Robust Error Handling
- Automatic screenshot capture on test failure
- Error message and stack trace capture
- Graceful degradation (failed artifact upload doesn't fail test)
- Job requeuing on consumer failure

### ✅ Observability
- Structured logging (Winston)
- Health and readiness endpoints
- Execution metrics (duration, status, artifacts)
- RabbitMQ queue monitoring

### ✅ Production Ready
- Docker containerization
- Graceful shutdown (SIGTERM, SIGINT)
- Auto-reconnection (RabbitMQ, database)
- Health checks in Dockerfile
- Environment-based configuration

## Building and Running

### Local Development
```bash
# Install dependencies
cd services/test-runner
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Docker Compose
```bash
# Build all services
docker-compose build

# Start test-runner service
docker-compose up test-runner

# View logs
docker-compose logs -f test-runner
```

### Standalone Docker
```bash
# Build image
docker build -t watt-test-runner -f services/test-runner/Dockerfile .

# Run container
docker run -p 3200:3200 \
  -e DATABASE_URL=postgresql://... \
  -e RABBITMQ_URL=amqp://... \
  -e MINIO_ENDPOINT=minio \
  watt-test-runner
```

## Testing the Service

### 1. Check Service Health
```bash
curl http://localhost:3200/health
curl http://localhost:3200/ready
```

### 2. Queue a Test Job (via Core App API)
```bash
curl -X POST http://localhost:3100/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "suiteId": "your-suite-id",
    "environmentId": "your-env-id",
    "browsers": ["chromium"]
  }'
```

### 3. Monitor RabbitMQ
- Open RabbitMQ Management UI: http://localhost:15672
- Login: watt / watt_dev_password
- Check queue: `test-execution-queue`
- Monitor message consumption

### 4. Check Execution Status
```bash
curl http://localhost:3100/api/executions/{execution-id}
```

### 5. View Artifacts in MinIO
- Open MinIO Console: http://localhost:9001
- Login: watt / watt_dev_password
- Browse bucket: `test-artifacts`
- View uploaded screenshots and videos

## Next Steps (Phase 3)

While the Test Runner now has core functionality, the following enhancements are planned for Phase 3:

1. **Cucumber Integration**
   - Full .feature file parsing and execution
   - Step definition loading
   - Scenario hooks (Before, After)
   - Tag filtering

2. **Advanced Reporting**
   - HTML report generation
   - Test result aggregation
   - Trend analysis
   - Screenshot annotations

3. **Parallel Execution**
   - Parallel scenario execution
   - Worker pool management
   - Resource optimization

4. **Self-Healing Locators**
   - Full integration of SelfHealingLocator class
   - Locator strategy fallbacks
   - AI-powered element identification

5. **Retry Logic**
   - Automatic test retry on failure
   - Configurable retry strategies
   - Flaky test detection

## Summary

Phase 2 successfully implements the **Test Execution Engine** with:

- ✅ **Complete Test Runner service** (8 TypeScript files, 973 lines)
- ✅ **Playwright integration** with multi-browser support
- ✅ **Artifact capture** (screenshots, videos)
- ✅ **MinIO object storage** integration
- ✅ **RabbitMQ job consumption** with auto-reconnection
- ✅ **Database persistence** for results and artifacts
- ✅ **Docker containerization** with health checks
- ✅ **Observability** with structured logging
- ✅ **Production-ready** error handling and graceful shutdown

The service is now ready to consume test execution jobs from the Core App, execute browser-based tests, and store all artifacts for analysis.
