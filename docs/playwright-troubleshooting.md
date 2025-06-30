# Playwright Environment Variable Troubleshooting

## 🚨 Issue: "Cannot find URL" Error

If you're getting an error like:

```
Error: NEXT_PUBLIC_SUPABASE_URL environment variable is required
```

This happens because Playwright tests run in a Node.js environment and can't access the `NEXT_PUBLIC_` environment variables from your `.env.local` file.

## 🔧 Solution Steps

### 1. Install Dependencies

```bash
# Install Playwright and dotenv
yarn add -D @playwright/test dotenv
yarn test:e2e:install
```

### 2. Check Your .env.local File

Make sure your `.env.local` file contains these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# For test data management (Service Role Key)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000
```

### 3. Get Your Service Role Key

If you don't have the service role key, get it from your local Supabase:

```bash
npx supabase status
```

Look for the `service_role key` in the output.

### 4. Verify Environment Variables

Run this command to check if your environment variables are accessible:

```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
console.log('APP_URL:', process.env.NEXT_PUBLIC_URL);
"
```

### 5. Run Tests

Once everything is set up:

```bash
# Start Supabase (if not already running)
npx supabase start

# Start Next.js dev server (in another terminal)
yarn dev

# Run Playwright tests
yarn test:e2e:ui
```

## 🔍 Alternative Solutions

### Option 1: Export Environment Variables

You can also export the variables directly in your terminal:

```bash
export NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export NEXT_PUBLIC_URL="http://localhost:3000"

yarn test:e2e
```

### Option 2: Create .env.test File

Create a `.env.test` file with the same variables as `.env.local`:

```bash
cp .env.local .env.test
```

### Option 3: Use Cross-env (for Windows)

If you're on Windows, install cross-env:

```bash
yarn add -D cross-env
```

Then update the test scripts in `package.json`:

```json
{
  "scripts": {
    "test:e2e": "cross-env NODE_ENV=test playwright test"
  }
}
```

## 🐛 Common Issues

### Issue: "dotenv module not found"

```bash
yarn add -D dotenv
```

### Issue: "Service role key not found"

```bash
npx supabase status
# Copy the service_role key from the output
```

### Issue: "Supabase not running"

```bash
npx supabase start
```

### Issue: "Next.js dev server not running"

```bash
yarn dev
```

## ✅ Verification

To verify everything is working:

1. **Check Supabase is running:**

   ```bash
   npx supabase status
   ```

2. **Check environment variables:**

   ```bash
   node -e "require('dotenv').config({ path: '.env.local' }); console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);"
   ```

3. **Run a simple test:**
   ```bash
   yarn test:e2e:ui
   ```

## 📞 Still Having Issues?

1. Check that all services are running (Supabase, Next.js)
2. Verify your `.env.local` file has the correct values
3. Make sure you've installed all dependencies
4. Try running with debug mode: `yarn test:e2e:debug`
5. Check the Playwright report: `npx playwright show-report`
