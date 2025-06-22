# Google OAuth Setup Guide

This guide will help you set up real Google OAuth authentication for your application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. Your application running on a domain (or localhost for development)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "My App OAuth")
4. Click "Create"

## Step 2: Enable Google+ API

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add scopes: `openid`, `email`, `profile`
   - Add test users if needed
   - Save and continue

4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "My App OAuth Client"
   - Authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/google/callback`
     - For production: `https://yourdomain.com/api/auth/google/callback`
   - Click "Create"

5. **Save the Client ID and Client Secret** - you'll need these for the environment variables

## Step 4: Environment Variables

Create a `.env.local` file in your project root and add:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Important Notes:**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are used server-side (API routes)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is used client-side (login page)
- Never expose the client secret in client-side code

## Step 5: Configure Redirect URIs

Make sure your redirect URIs in Google Cloud Console match your application:

### Development:
```
http://localhost:3000/api/auth/google/callback
```

### Production:
```
https://yourdomain.com/api/auth/google/callback
```

## Step 6: Test the Implementation

1. Start your development server: `npm run dev`
2. Navigate to your login page
3. Click "Continue with Google"
4. You should be redirected to Google's consent screen
5. After authorization, you'll be redirected back to your app

## Security Features Implemented

### State Parameter
- Random state parameter generated for each OAuth request
- Stored in localStorage and verified on callback
- Prevents CSRF attacks

### Error Handling
- Comprehensive error handling for all OAuth steps
- User-friendly error messages
- Proper cleanup on errors

### Token Management
- Secure token exchange on server-side
- Access tokens used only for user info retrieval
- No sensitive data stored in client-side code

## Production Considerations

### Environment Variables
- Use proper environment variable management in production
- Never commit `.env.local` to version control
- Use your hosting platform's environment variable system

### HTTPS
- Google OAuth requires HTTPS in production
- Ensure your domain has a valid SSL certificate

### Redirect URIs
- Update redirect URIs in Google Cloud Console for production
- Remove development URIs from production environment

### Rate Limiting
- Implement rate limiting for OAuth endpoints
- Monitor for abuse and implement security measures

## Troubleshooting

### Common Issues

1. **"Invalid redirect_uri" error**
   - Check that your redirect URI exactly matches what's configured in Google Cloud Console
   - Ensure no trailing slashes or protocol mismatches

2. **"Missing client_id" error**
   - Verify your environment variables are set correctly
   - Check that the client ID is being loaded properly

3. **"Invalid state parameter" error**
   - This usually indicates a CSRF attack or browser issues
   - Clear browser cache and try again

4. **"Failed to exchange authorization code" error**
   - Check that your client secret is correct
   - Verify the authorization code hasn't expired (they expire quickly)

### Debug Mode

To enable debug logging, add this to your `.env.local`:

```env
DEBUG_OAUTH=true
```

## API Endpoints

### POST /api/auth/google/token
Exchanges authorization code for access token.

**Request Body:**
```json
{
  "code": "authorization_code_from_google",
  "redirect_uri": "your_redirect_uri"
}
```

**Response:**
```json
{
  "access_token": "google_access_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## User Data Retrieved

The OAuth flow retrieves the following user information from Google:
- `id`: Google user ID
- `email`: User's email address
- `name`: Full name
- `picture`: Profile picture URL
- `given_name`: First name
- `family_name`: Last name

## Next Steps

After successful OAuth implementation, consider:

1. **User Session Management**: Implement JWT tokens or session management
2. **Database Integration**: Store user data in your database
3. **Profile Management**: Allow users to update their profiles
4. **Logout Functionality**: Implement proper logout with token revocation
5. **Refresh Tokens**: Implement refresh token logic for long-term sessions 