# Playwright E2E Test Setup Guide

This guide will help you set up and run the Playwright E2E tests for the Curious HR Synapse application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Playwright and browsers
yarn add -D @playwright/test
yarn test:e2e:install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# For test data management (Service Role Key)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000
```

### 3. Start Services

```bash
# Start Supabase
npx supabase start

# Start Next.js dev server (in another terminal)
yarn dev
```

### 4. Run Tests

```bash
# Run all tests
yarn test:e2e

# Run tests with UI mode (recommended for debugging)
yarn test:e2e:ui
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── registration.spec.ts     # Main test file
│   ├── helpers/
│   │   └── test-utils.ts        # Helper functions
│   └── README.md                # Detailed documentation
├── playwright.config.ts         # Playwright configuration
└── PLAYWRIGHT_SETUP.md          # This file
```

## 🧪 Test Coverage

The `registration.spec.ts` file includes comprehensive tests for:

### 1. Complete User Journey

- **User Registration**: Navigate to login → Register → Verify email message → Sign in → Dashboard
- **Expense Creation**: Create new expense → Fill form → Submit → Verify in list
- **Logout Flow**: Access user menu → Logout → Verify redirect

### 2. Additional Test Cases

- **Existing User Login**: Pre-create user → Sign in → Verify dashboard
- **Invalid Credentials**: Test error handling for wrong credentials
- **Form Validation**: Test required field validation
- **Expense Validation**: Test expense form validation

## 🔧 Configuration Details

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:3000` (configurable)
- **Browsers**: Chrome, Firefox, Safari
- **Web Server**: Auto-starts Next.js dev server
- **Retries**: 2 on CI, 0 locally
- **Screenshots/Videos**: Captured on failure
- **Traces**: Collected on first retry

### Test Data Management

- **Unique Emails**: Generated with timestamps for isolation
- **Automatic Cleanup**: Users and expenses deleted after each test
- **Service Role Access**: Uses Supabase admin API for test data

## 🛠️ Available Commands

```bash
# Test Commands
yarn test:e2e              # Run all tests
yarn test:e2e:ui           # Run with UI mode
yarn test:e2e:headed       # Run with visible browser
yarn test:e2e:debug        # Run in debug mode
yarn test:e2e:install      # Install Playwright browsers

# Specific Test Runs
npx playwright test registration.spec.ts                    # Run specific file
npx playwright test --project=chromium                      # Run on specific browser
npx playwright test --grep "Complete user registration"     # Run specific test
```

## 🔍 Debugging Tests

### UI Mode (Recommended)

```bash
yarn test:e2e:ui
```

- Visual test runner
- Real-time execution
- Screenshot/video viewing
- Step-by-step debugging

### Debug Mode

```bash
yarn test:e2e:debug
```

- Opens browser in headed mode
- Pauses at each step
- Allows manual interaction
- Shows detailed logs

### Headed Mode

```bash
yarn test:e2e:headed
```

- Runs tests with visible browser
- Good for seeing what's happening
- Useful for debugging selectors

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module '@playwright/test'"**

   ```bash
   yarn add -D @playwright/test
   yarn test:e2e:install
   ```

2. **Supabase Connection Errors**

   ```bash
   npx supabase status          # Check if running
   npx supabase start           # Start services
   ```

3. **Test Failures Due to Email Confirmation**

   - Tests assume email confirmation is handled in test environment
   - For production testing, configure email testing

4. **Selector Issues**

   - Use `yarn test:e2e:headed` to see what's happening
   - Update selectors in `test-utils.ts` if UI changes

5. **Database State Issues**
   ```bash
   yarn db:reset               # Reset database
   npx supabase db reset       # Alternative reset
   ```

### Environment Variables

Ensure these are set correctly:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_URL`

### Service Role Key

The service role key is required for test data management. Get it from:

```bash
npx supabase status
```

## 📊 Test Reports

After running tests, view reports:

```bash
npx playwright show-report
```

Reports include:

- Test results and timing
- Screenshots on failure
- Videos on failure
- Traces for debugging

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "yarn"

      - name: Install dependencies
        run: yarn install

      - name: Install Playwright browsers
        run: yarn test:e2e:install

      - name: Start Supabase
        run: npx supabase start

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

## 🎯 Best Practices

1. **Test Isolation**: Each test is independent
2. **Data Cleanup**: Automatic cleanup after each test
3. **Meaningful Assertions**: Clear, descriptive assertions
4. **Stable Selectors**: Use role-based selectors when possible
5. **Error Handling**: Proper error handling and logging
6. **Performance**: Keep tests fast and efficient
7. **Maintenance**: Update tests when UI changes

## 📝 Helper Functions

The `test-utils.ts` file provides reusable functions:

- `waitForLoginPage()` - Verify login page loaded
- `signIn()` / `signUp()` - Authentication helpers
- `waitForDashboard()` - Verify dashboard loaded
- `createExpense()` - Create new expense
- `logout()` - Logout user
- `generateTestEmail()` - Generate unique test emails
- `waitForText()` - Wait for text to be visible

## 🚨 Important Notes

1. **Email Confirmation**: Tests assume email confirmation is handled in test environment
2. **Service Role Key**: Required for test data management
3. **Database State**: Tests clean up after themselves
4. **Browser Compatibility**: Tests run on Chrome, Firefox, and Safari
5. **Network Dependencies**: Tests require local Supabase and Next.js running

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the test logs and reports
3. Use debug mode to step through tests
4. Verify environment variables are set correctly
5. Ensure all services are running

For more detailed information, see `tests/e2e/README.md`.
