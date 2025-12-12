#!/bin/bash

echo "Creating test executions..."

# Execution 1
curl -s -X POST http://localhost:3100/api/executions \
  -H "Content-Type: application/json" \
  -d '{"suiteId":"1c1319d7-d701-4be3-b48e-f45c9241f90b","environmentId":"7bc2838b-57b2-4fe2-ad1b-eb89b812fff3","triggeredBy":"d06d88c0-bacb-438c-84b6-28749c6e0449","triggerSource":"manual","browsers":["chromium"]}' > /dev/null
echo "✓ Execution 1 created"

# Execution 2
curl -s -X POST http://localhost:3100/api/executions \
  -H "Content-Type: application/json" \
  -d '{"suiteId":"1c1319d7-d701-4be3-b48e-f45c9241f90b","environmentId":"7bc2838b-57b2-4fe2-ad1b-eb89b812fff3","triggeredBy":"d06d88c0-bacb-438c-84b6-28749c6e0449","triggerSource":"ci_cd","browsers":["firefox"]}' > /dev/null
echo "✓ Execution 2 created"

# Execution 3
curl -s -X POST http://localhost:3100/api/executions \
  -H "Content-Type: application/json" \
  -d '{"suiteId":"1c1319d7-d701-4be3-b48e-f45c9241f90b","environmentId":"7bc2838b-57b2-4fe2-ad1b-eb89b812fff3","triggeredBy":"d06d88c0-bacb-438c-84b6-28749c6e0449","triggerSource":"manual","browsers":["webkit"]}' > /dev/null
echo "✓ Execution 3 created"

# Execution 4
curl -s -X POST http://localhost:3100/api/executions \
  -H "Content-Type: application/json" \
  -d '{"suiteId":"1c1319d7-d701-4be3-b48e-f45c9241f90b","environmentId":"7bc2838b-57b2-4fe2-ad1b-eb89b812fff3","triggeredBy":"d06d88c0-bacb-438c-84b6-28749c6e0449","triggerSource":"schedule","browsers":["chromium"]}' > /dev/null
echo "✓ Execution 4 created"

# Execution 5
curl -s -X POST http://localhost:3100/api/executions \
  -H "Content-Type: application/json" \
  -d '{"suiteId":"1c1319d7-d701-4be3-b48e-f45c9241f90b","environmentId":"7bc2838b-57b2-4fe2-ad1b-eb89b812fff3","triggeredBy":"d06d88c0-bacb-438c-84b6-28749c6e0449","triggerSource":"webhook","browsers":["firefox"]}' > /dev/null
echo "✓ Execution 5 created"

echo ""
echo "✅ All test executions created successfully!"
echo "Open http://localhost:3002 to view them in the UI"
