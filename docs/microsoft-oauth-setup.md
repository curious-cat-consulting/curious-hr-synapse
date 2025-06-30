# Microsoft OAuth Setup

This guide explains how to set up Microsoft OAuth authentication for your application.

## Prerequisites

- A Microsoft Azure account
- Access to Azure Active Directory (Azure AD)

## Step 1: Register Your Application in Azure AD

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the registration form:

   - **Name**: Your app name (e.g., "Curious HR Synapse")
   - **Supported account types**: Choose based on your needs:
     - **Accounts in this organizational directory only**: For single tenant
     - **Accounts in any organizational directory**: For multi-tenant
     - **Accounts in any organizational directory and personal Microsoft accounts**: For both work and personal accounts
   - **Redirect URI**:
     - Type: **Web**
     - URI: `http://localhost:54321/auth/v1/callback` (for local development)
     - For production: `https://your-domain.supabase.co/auth/v1/callback`

5. Click **Register**

## Step 2: Get Your Client ID and Secret

1. After registration, note down the **Application (client) ID** from the overview page
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Add a description and choose an expiration
5. Copy the **Value** (this is your client secret - you won't be able to see it again)

## Step 3: Configure API Permissions (IMPORTANT!)

This step is crucial for resolving the "Error getting user email from external provider" error.

1. In your Azure app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Search for and select the following permissions:
   - `email` - View users' email address
   - `openid` - Sign users in
   - `profile` - View users' basic profile
6. Click **Add permissions**
7. **Important**: Click **Grant admin consent** (if you're an admin) or ensure users can consent to these permissions

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
SUPABASE_AUTH_EXTERNAL_AZURE_CLIENT_ID=your_client_id_here
SUPABASE_AUTH_EXTERNAL_AZURE_SECRET=your_client_secret_here
```

## Step 5: Configure Redirect URIs

1. In your Azure app registration, go to **Authentication**
2. Add the following redirect URIs:
   - `http://localhost:54321/auth/v1/callback` (local development)
   - `https://your-project-ref.supabase.co/auth/v1/callback` (production)

## Step 6: Restart Supabase

After adding the environment variables, restart your local Supabase instance:

```bash
yarn supabase stop
yarn supabase start
```

## Step 7: Test the Integration

1. Start your development server: `yarn dev`
2. Go to the login page
3. Click "Continue with Microsoft"
4. You should be redirected to Microsoft's login page
5. After successful authentication, you'll be redirected back to your app

## Troubleshooting

### Common Issues

1. **"Error getting user email from external provider"**

   - **Solution**: Ensure you've configured the API permissions as described in Step 3
   - Make sure the `email` permission is granted and admin consent is provided
   - Check that your Azure app registration has the correct redirect URIs

2. **"AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"**

   - Ensure the redirect URI in your Azure app registration matches exactly what Supabase expects
   - Check that you're using the correct Supabase project URL

3. **"AADSTS700016: Application with identifier was not found in the directory"**

   - Verify your client ID is correct
   - Ensure you're using the correct tenant ID if you're in a multi-tenant setup

4. **"Invalid client secret"**
   - Make sure you copied the secret value, not the secret ID
   - Check that the secret hasn't expired

### Production Deployment

For production deployment:

1. Update the redirect URIs in Azure to use your production Supabase URL
2. Set the environment variables in your production environment
3. Ensure your Supabase project has the correct site URL configured

## Security Notes

- Never commit your client secret to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your client secrets
- Consider using Azure Key Vault for production secret management
