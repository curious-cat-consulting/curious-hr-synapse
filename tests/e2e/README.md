# Playwright E2E Tests

This directory contains end-to-end tests for the Curious HR Synapse application using Playwright.

## Prerequisites

Before running the E2E tests, ensure you have:

1. **Node.js and Yarn** installed
2. **Supabase CLI** installed and configured
3. **Local Supabase instance** running
4. **Environment variables** properly configured

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Install Playwright Browsers

```bash
yarn test:e2e:install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# For test data management (Service Role Key)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000
```

### 4. Start Local Supabase

```bash
# Start Supabase services
npx supabase start

# Reset database (optional, for clean state)
yarn db:reset
```

### 5. Start the Development Server

```bash
yarn dev
```

## Running Tests

### Run All Tests

```bash
yarn test:e2e
```

### Run Tests with UI Mode

```bash
yarn test:e2e:ui
```

### Run Tests in Headed Mode (Visible Browser)

```bash
yarn test:e2e:headed
```

### Run Tests in Debug Mode

```bash
yarn test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test registration.spec.ts
```

### Run Tests on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

### `registration.spec.ts`

This test file covers the complete user journey:

1. **User Registration Flow**

   - Navigate to login page
   - Register new user with unique email
   - Verify email confirmation message
   - Sign in with new account
   - Verify dashboard access

2. **Expense Creation Flow**

   - Create new expense via drawer
   - Fill expense form (title, description)
   - Submit expense
   - Verify expense appears in list

3. **Logout Flow**

   - Access user account menu
   - Click logout
   - Verify redirect to home page

4. **Additional Test Cases**
   - Existing user login
   - Invalid credentials handling
   - Form validation

## Test Data Management

The tests include comprehensive test data management:

- **Unique Test Emails**: Each test run generates unique email addresses using timestamps
- **Automatic Cleanup**: Test users and their expenses are automatically deleted after each test
- **Service Role Access**: Uses Supabase service role key for test data management

## Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Base URL**: `http://localhost:3000` (configurable via `NEXT_PUBLIC_URL`)
- **Web Server**: Automatically starts the Next.js dev server
- **Browsers**: Chrome, Firefox, and Safari
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on test failure
- **Videos**: Recorded on test failure
- **Traces**: Collected on first retry

## Troubleshooting

### Common Issues

1. **Supabase Connection Errors**

   - Ensure Supabase is running: `npx supabase status`
   - Check environment variables are set correctly
   - Verify service role key has admin permissions

2. **Test Failures Due to Email Confirmation**

   - The tests assume email confirmation is handled or disabled in test environment
   - For production-like testing, you may need to configure email testing

3. **Selector Issues**

   - If UI elements change, update selectors in the test file
   - Use Playwright's `--headed` mode to debug selector issues

4. **Database State Issues**
   - Run `yarn db:reset` to reset database state
   - Check that test cleanup is working properly

### Debug Mode

Use debug mode to step through tests:

```bash
yarn test:e2e:debug
```

This will:

- Open browser in headed mode
- Pause execution at each step
- Allow manual interaction
- Show detailed logs

### UI Mode

Use UI mode for interactive testing:

```bash
yarn test:e2e:ui
```

This provides:

- Visual test runner
- Real-time test execution
- Screenshot and video viewing
- Test debugging tools

## CI/CD Integration

For CI/CD pipelines, ensure:

1. **Environment Variables**: Set all required environment variables
2. **Supabase Setup**: Configure Supabase for CI environment
3. **Browser Installation**: Install Playwright browsers in CI
4. **Test Reports**: Configure test reporting and artifacts

Example GitHub Actions workflow:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: yarn test:e2e
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    NEXT_PUBLIC_URL: ${{ secrets.APP_URL }}

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Data Cleanup**: Always clean up test data after tests
3. **Meaningful Assertions**: Use descriptive assertions that clearly indicate what's being tested
4. **Selectors**: Prefer stable selectors (data-testid, role-based) over text-based selectors
5. **Error Handling**: Include proper error handling and logging
6. **Performance**: Keep tests fast and efficient
7. **Maintenance**: Regularly update tests when UI changes

# E2E Test Cleanup System

This directory contains end-to-end tests with a robust cleanup system that ensures test users are properly cleaned up even when tests fail or are interrupted.

## Cleanup Strategy

The cleanup system uses a multi-layered approach:

### 1. Per-Test Cleanup (`afterEach`)

Each test automatically cleans up its test data in the `afterEach` hook using the `cleanupTestData` function. This handles:

- Users created via API (`testUserId`)
- Users created via signup flow (found by email)
- Associated expenses and accounts

### 2. Global Teardown (`global-teardown.ts`)

After all tests complete (even if they fail), the global teardown runs and cleans up any orphaned test users by:

- Finding test users created in the last hour with `@curiouscat.consulting` email domain
- Deleting them and their associated data

### 3. Helper Functions

#### `cleanupTestData(testEmail, testUserId?)`

Comprehensive cleanup function that handles both API-created and signup-created users.

#### `deleteUserByEmail(email)`

Finds and deletes a user by email address.

#### `deleteUserById(userId)`

Deletes a user by ID and all associated data (expenses, accounts).

#### `cleanupOrphanedTestUsers()`

Cleans up any test users that weren't properly cleaned up by individual tests.

## File Structure

```
tests/e2e/
├── helpers/
│   └── test-utils.ts          # Test utilities and cleanup functions
├── global-setup.ts            # Global setup (runs before all tests)
├── global-teardown.ts         # Global teardown (runs after all tests)
├── registration.spec.ts       # Test specifications
└── README.md                  # This file
```

## Usage

### Basic Test Structure

```typescript
test.describe("My Test Suite", () => {
  let testEmail: string;
  let testUserId: string | undefined;

  test.beforeEach(async () => {
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    await cleanupTestData(testEmail, testUserId);
  });

  test("My test", async ({ page }) => {
    // Your test code here
    // If you create a user via API, set testUserId
    testUserId = await createTestUser(testEmail, "password");
  });
});
```

### Creating Test Users

- **Via API**: Use `createTestUser(email, password)` for pre-created users
- **Via Signup**: Use the signup flow and the email will be cleaned up automatically

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_URL`

## Benefits

1. **Reliable Cleanup**: Test users are cleaned up even if tests fail or crash
2. **No Orphaned Data**: Global teardown catches any missed cleanup
3. **Comprehensive**: Cleans up users, expenses, and accounts
4. **Safe**: Uses service role key for admin operations
5. **Logging**: Provides clear feedback about cleanup operations

## Running Tests

```bash
# Run all E2E tests
yarn test:e2e

# Run specific test file
yarn test:e2e registration.spec.ts

# Run with UI
yarn test:e2e --ui

# List all tests without running them
yarn test:e2e --list
```
