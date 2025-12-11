# WATT Example Test Suite

This directory contains sample test files demonstrating how to write tests for WATT (Web Application Test Tool).

## Directory Structure

```
sample-test-suite/
├── features/               # Gherkin .feature files
│   └── login.feature       # Sample login test scenarios
│
├── data/                   # JSON test data files
│   ├── users.json          # User credentials and account data
│   └── environments.json   # Environment configurations
│
├── step-definitions/       # TypeScript step implementations
│   └── login.steps.ts      # Step definitions for login feature
│
├── page-objects/           # Page Object Model classes
│   └── LoginPage.ts        # Login page abstraction
│
└── support/                # Support files
    ├── world.ts            # Cucumber World (test context)
    └── data-loader.ts      # JSON data loading utility
```

## Writing Feature Files (.feature)

Feature files use Gherkin syntax to describe test scenarios in plain English.

### Basic Structure

```gherkin
@tag1 @tag2
Feature: Feature Name
  As a [role]
  I want [feature]
  So that [benefit]

  Background:
    Given some precondition

  @scenario-tag
  Scenario: Scenario Name
    Given some context
    When some action
    Then expected outcome
```

### Using Data References

Reference JSON data using `data:` prefix:

```gherkin
When I enter username "data:users.validUser.email"
And I enter password "data:users.validUser.password"
Then I should see message "data:errors.invalidCredentials"
```

### Data-Driven Tests

Use Scenario Outline with Examples:

```gherkin
Scenario Outline: Login with different roles
  When I login as "<email>" with "<password>"
  Then I should see "<dashboard>"

  Examples:
    | email                  | password                  | dashboard       |
    | data:users.admin.email | data:users.admin.password | Admin Dashboard |
    | data:users.user.email  | data:users.user.password  | User Home       |
```

## Writing Data Files (.json)

Data files provide test data that can be referenced from feature files.

### Required Structure

```json
{
  "$schema": "../../schemas/test-data.schema.json",
  "metadata": {
    "description": "Description of this data file",
    "version": "1.0.0",
    "environment": "staging"
  },
  "users": {
    "validUser": {
      "email": "user@example.com",
      "password": "password123"
    }
  }
}
```

### Data Path Resolution

Data is accessed using dot notation:
- `users.validUser.email` -> `"user@example.com"`
- `errors.invalidCredentials` -> `"Invalid email or password"`
- `security.maxLoginAttempts` -> `5`

## Execution Configuration

Configure test execution via API or UI:

```json
{
  "suiteId": "login-tests",
  "browsers": ["chrome", "firefox"],
  "parallel": 4,
  "artifacts": {
    "video": { "enabled": true, "mode": "always" },
    "screenshots": { "enabled": true, "mode": "on-failure" },
    "reports": { "html": true, "pdf": true }
  }
}
```

## Supported Tags

| Tag | Purpose |
|-----|---------|
| `@smoke` | Quick sanity tests |
| `@critical` | Business-critical tests |
| `@positive` | Happy path scenarios |
| `@negative` | Error/edge case scenarios |
| `@data-driven` | Parameterized tests |
| `@skip` | Skip this test |
| `@wip` | Work in progress |

## Self-Healing Locators

Page objects support multiple locator strategies for self-healing:

```typescript
readonly locators = {
  loginButton: {
    primary: '#login-btn',
    fallbacks: [
      'button[type="submit"]',
      '[data-testid="login-button"]',
      'button:has-text("Login")'
    ]
  }
};
```

## Artifact Configuration

WATT provides **independent toggles** for each artifact type:

### Video Recording

| Option | Values | Description |
|--------|--------|-------------|
| `enabled` | `true` / `false` | Enable/disable video recording |
| `mode` | `always` / `on-failure` | When to keep recordings |
| `format` | `webm` / `mp4` | Video format |
| `quality` | `low` / `medium` / `high` | Recording quality |

### Screenshot Capture

| Option | Values | Description |
|--------|--------|-------------|
| `enabled` | `true` / `false` | Enable/disable screenshots |
| `mode` | `always` / `on-failure` / `per-step` | When to capture |
| `fullPage` | `true` / `false` | Capture full page or viewport |

### Document Export

| Option | Values | Description |
|--------|--------|-------------|
| `enabled` | `true` / `false` | Enable/disable report generation |
| `html` | `true` / `false` | Generate interactive HTML report |
| `pdf` | `true` / `false` | Generate printable PDF report |
| `includeVideos` | `true` / `false` | Embed/link videos in reports |
| `includeScreenshots` | `true` / `false` | Embed screenshots in reports |

## Configuration Examples

### Example 1: Full Documentation Mode (For Compliance/Audit)

Record everything and generate comprehensive reports with all artifacts.

```json
{
  "executionConfig": {
    "suiteId": "compliance-tests",
    "browsers": ["chrome"],
    "artifacts": {
      "video": {
        "enabled": true,
        "mode": "always",
        "format": "webm",
        "quality": "high"
      },
      "screenshots": {
        "enabled": true,
        "mode": "per-step",
        "fullPage": true
      },
      "documents": {
        "enabled": true,
        "html": true,
        "pdf": true,
        "includeVideos": true,
        "includeScreenshots": true
      }
    }
  }
}
```

**Result:**
- ✓ Video recorded for entire test execution
- ✓ Screenshot captured at every step
- ✓ HTML report with embedded screenshots and video links
- ✓ PDF report suitable for printing/archiving

---

### Example 2: Debugging Mode (Failures Only)

Capture artifacts only when tests fail to conserve storage.

```json
{
  "executionConfig": {
    "suiteId": "regression-tests",
    "browsers": ["chrome", "firefox"],
    "artifacts": {
      "video": {
        "enabled": true,
        "mode": "on-failure",
        "format": "webm",
        "quality": "medium"
      },
      "screenshots": {
        "enabled": true,
        "mode": "on-failure",
        "fullPage": true
      },
      "documents": {
        "enabled": true,
        "html": true,
        "pdf": false,
        "includeVideos": true,
        "includeScreenshots": true
      }
    }
  }
}
```

**Result:**
- ✓ Video only saved when test fails
- ✓ Screenshots only captured on failure
- ✓ HTML report generated (with artifacts for failed tests only)
- ✗ No PDF report

---

### Example 3: Lightweight Mode (Report Only, No Media)

Generate reports without video/screenshots to minimize overhead.

```json
{
  "executionConfig": {
    "suiteId": "smoke-tests",
    "browsers": ["chrome"],
    "artifacts": {
      "video": {
        "enabled": false
      },
      "screenshots": {
        "enabled": false
      },
      "documents": {
        "enabled": true,
        "html": true,
        "pdf": false,
        "includeVideos": false,
        "includeScreenshots": false
      }
    }
  }
}
```

**Result:**
- ✗ No video recording
- ✗ No screenshots
- ✓ HTML report with test results only (text-based)
- ✗ No PDF report

---

### Example 4: Screenshots Only (No Video)

Capture step-by-step screenshots without video for bandwidth efficiency.

```json
{
  "executionConfig": {
    "suiteId": "visual-regression-tests",
    "browsers": ["chrome", "firefox", "safari"],
    "artifacts": {
      "video": {
        "enabled": false
      },
      "screenshots": {
        "enabled": true,
        "mode": "per-step",
        "fullPage": true
      },
      "documents": {
        "enabled": true,
        "html": true,
        "pdf": true,
        "includeVideos": false,
        "includeScreenshots": true
      }
    }
  }
}
```

**Result:**
- ✗ No video recording
- ✓ Screenshot at every test step
- ✓ HTML report with embedded screenshots
- ✓ PDF report with screenshots

---

### Example 5: Video Only (No Screenshots)

Record video without screenshots for continuous flow review.

```json
{
  "executionConfig": {
    "suiteId": "e2e-flow-tests",
    "browsers": ["chrome"],
    "artifacts": {
      "video": {
        "enabled": true,
        "mode": "always",
        "format": "mp4",
        "quality": "high"
      },
      "screenshots": {
        "enabled": false
      },
      "documents": {
        "enabled": true,
        "html": true,
        "pdf": false,
        "includeVideos": true,
        "includeScreenshots": false
      }
    }
  }
}
```

**Result:**
- ✓ Full video recording (MP4 format)
- ✗ No screenshots
- ✓ HTML report with embedded video player
- ✗ No PDF report

---

### Example 6: PDF Report Only (For Management)

Generate printable PDF report without media artifacts.

```json
{
  "executionConfig": {
    "suiteId": "executive-summary",
    "browsers": ["chrome"],
    "artifacts": {
      "video": {
        "enabled": false
      },
      "screenshots": {
        "enabled": true,
        "mode": "on-failure",
        "fullPage": false
      },
      "documents": {
        "enabled": true,
        "html": false,
        "pdf": true,
        "includeVideos": false,
        "includeScreenshots": true
      }
    }
  }
}
```

**Result:**
- ✗ No video recording
- ✓ Screenshots only on failures (viewport only)
- ✗ No HTML report
- ✓ PDF report with failure screenshots and executive summary

---

### Example 7: CI/CD Pipeline (Minimal Artifacts)

Fast execution with minimal artifacts for quick feedback.

```json
{
  "executionConfig": {
    "suiteId": "pr-validation",
    "browsers": ["chrome"],
    "parallel": 8,
    "artifacts": {
      "video": {
        "enabled": false
      },
      "screenshots": {
        "enabled": true,
        "mode": "on-failure",
        "fullPage": false
      },
      "documents": {
        "enabled": true,
        "html": true,
        "pdf": false,
        "includeVideos": false,
        "includeScreenshots": true
      }
    }
  }
}
```

**Result:**
- ✗ No video recording (faster execution)
- ✓ Screenshots only on failures
- ✓ HTML report for CI/CD dashboard
- ✗ No PDF report

---

### Example 8: All Artifacts Disabled (Metrics Only)

Run tests without any artifacts, just collect pass/fail metrics.

```json
{
  "executionConfig": {
    "suiteId": "performance-benchmark",
    "browsers": ["chrome"],
    "artifacts": {
      "video": {
        "enabled": false
      },
      "screenshots": {
        "enabled": false
      },
      "documents": {
        "enabled": false
      }
    }
  }
}
```

**Result:**
- ✗ No video recording
- ✗ No screenshots
- ✗ No reports
- ✓ Only JSON metrics stored in database

---

## API Control

You can control artifact generation via API per execution:

```bash
# Execute with specific artifact configuration
curl -X POST https://api.watt.io/v1/tests/execute \
  -H "Content-Type: application/json" \
  -d '{
    "suiteId": "login-tests",
    "browsers": ["chrome", "firefox"],
    "artifacts": {
      "video": { "enabled": true, "mode": "on-failure" },
      "screenshots": { "enabled": true, "mode": "per-step" },
      "documents": { "enabled": true, "html": true, "pdf": true }
    }
  }'
```

## User Preferences

Users can set default artifact preferences in their profile:

**UI Settings > Test Execution > Artifacts**

```
[ ] Enable Video Recording
    ○ Always  ● On Failure  ○ Never
    Format: [WebM ▾]  Quality: [Medium ▾]

[✓] Enable Screenshots
    ○ Per Step  ● On Failure  ○ Never
    [✓] Full Page

[✓] Generate Reports
    [✓] HTML Report
    [ ] PDF Report
    [✓] Include Videos
    [✓] Include Screenshots
```

---

## Getting Help

- See [ARCHITECTURE_AND_ROADMAP.md](../ARCHITECTURE_AND_ROADMAP.md) for full documentation
- See [schemas/test-data.schema.json](../schemas/test-data.schema.json) for data file validation
