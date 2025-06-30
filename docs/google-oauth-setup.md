# Google OAuth Setup

This document explains how to set up Google OAuth authentication for the Curious HR Synapse application.

## Prerequisites

1. A Google Cloud Platform account
2. Access to the Google Cloud Console
3. Supabase project with authentication enabled

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 2. Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace organization)
3. Fill in the required information:
   - App name: "Curious HR Synapse"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Add the following scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users if you're in testing mode

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add the following authorized redirect URIs:
   - For local development: `http://localhost:54321/auth/v1/callback`
   - For production: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Note down the Client ID and Client Secret

### 4. Configure Supabase

1. In your Supabase dashboard, go to "Authentication" > "Providers"
2. Enable Google provider
3. Enter the Client ID and Client Secret from step 3
4. Save the configuration

### 5. Set Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

### 6. Update Supabase Config

The `supabase/config.toml` file should already be configured with Google OAuth enabled:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

### 7. Test the Integration

1. Start your local development server: `yarn dev`
2. Start Supabase: `npx supabase start`
3. Navigate to `/login`
4. Click the "Continue with Google" button
5. Complete the OAuth flow

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**: Make sure the redirect URI in Google Cloud Console matches exactly with your Supabase auth callback URL.

2. **"OAuth consent screen not configured"**: Ensure you've completed the OAuth consent screen setup in Google Cloud Console.

3. **"Client ID not found"**: Verify that the Client ID in your environment variables matches the one from Google Cloud Console.

4. **"Invalid client secret"**: Double-check that the Client Secret is correctly copied and stored in your environment variables.

### Testing

Run the E2E tests to verify the Google OAuth button is working:

```bash
yarn test:e2e tests/e2e/login/google-oauth.spec.ts
```

## Security Considerations

1. **Never commit secrets to version control**: Always use environment variables for sensitive information.

2. **Use HTTPS in production**: Google OAuth requires HTTPS for production environments.

3. **Regularly rotate secrets**: Consider rotating your OAuth client secrets periodically.

4. **Monitor usage**: Keep an eye on your Google Cloud Console for any unusual activity.

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen to "In production" status
2. Add your production domain to the authorized domains
3. Update the redirect URIs to use your production Supabase URL
4. Ensure all environment variables are properly set in your production environment
