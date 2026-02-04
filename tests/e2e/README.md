# E2E Tests

End-to-end tests for critical user journeys using Playwright.

## Test Coverage

### Critical User Journeys

1. **Start a New Debate** (`critical-journeys.spec.ts`)
   - Load homepage with correct elements
   - Enter topic and submit argument
   - Receive AI response (mocked)
   - Navigate to advanced setup

2. **Share a Debate**
   - Load share page for debates
   - Verify share functionality exists
   - Test share API metadata

3. **Browse the Blog**
   - Load blog index
   - Navigate to individual posts
   - Verify SEO meta tags

4. **View Debate History**
   - Load history page
   - Navigate from homepage

5. **Mobile Experience**
   - Responsive layout on mobile
   - Touch-friendly buttons

6. **Error Recovery**
   - 404 page handling
   - API error handling

## Running Tests

### Prerequisites

```bash
# Install Playwright browsers (first time only)
npx playwright install
```

### Run All E2E Tests

```bash
# Start dev server and run tests
npx playwright test tests/e2e/

# Or run with UI mode
npx playwright test tests/e2e/ --ui
```

### Run Specific Tests

```bash
# Run journey tests only
npx playwright test tests/e2e/critical-journeys.spec.ts

# Run in headed mode (see browser)
npx playwright test tests/e2e/ --headed

# Run specific browser
npx playwright test tests/e2e/ --project=chromium
```

### Run Against Production

```bash
# Point to production URL
BASE_URL=https://debateai.org npx playwright test tests/e2e/
```

## Test Design Principles

1. **Mocked AI Responses**: All Claude API calls are mocked to:
   - Avoid API costs
   - Ensure deterministic tests
   - Run quickly

2. **No Auth State Required**: Tests work without being signed in.
   Auth-dependent features are tested by mocking or skipped.

3. **Mobile-First**: Mobile viewport tests ensure responsive design.

4. **Error Resilience**: Tests verify graceful error handling.

## CI/CD Integration

Tests run automatically on pull requests. The config:
- Uses 1 worker in CI (for stability)
- Retries failed tests twice
- Captures screenshots on failure
- Generates HTML report

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: npx playwright test tests/e2e/
  env:
    CI: true
```

## Adding New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Follow the journey pattern: describe user goal, then steps
3. Mock external APIs (Claude, Stripe, etc.)
4. Test both happy path and error cases
