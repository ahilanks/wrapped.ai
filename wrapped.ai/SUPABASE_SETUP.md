# Supabase Integration Setup

This guide will help you set up Supabase to store user data when users connect via Google OAuth.

## 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google OAuth (you already have these)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase (new)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App URL (for development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the editor
4. Run the SQL script to create the necessary tables

## 3. Supabase Credentials

To get your Supabase credentials:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Add them to your `.env.local` file

## 4. How It Works

When a user signs in with Google:

1. The OAuth flow exchanges the authorization code for tokens
2. User information is fetched from Google
3. User data is automatically saved to your Supabase database
4. The user is logged into your application

## 5. Database Tables

The setup creates two main tables:

- `users`: Stores basic user information (email, name, Google ID, avatar)
- `user_profiles`: Stores additional user profile data and preferences

## 6. API Endpoints

- `POST /api/auth/user`: Creates or updates user data in Supabase
- `GET /api/auth/user?email=...`: Retrieves user data by email

## 7. Testing

1. Start your development server: `npm run dev`
2. Try signing in with Google
3. Check your Supabase dashboard to see the user data being saved
4. You can also check the browser console for any errors

## 8. Troubleshooting

If you encounter issues:

1. Check that all environment variables are set correctly
2. Verify the Supabase tables were created successfully
3. Check the browser console and server logs for errors
4. Ensure your Supabase project has the correct permissions set up 