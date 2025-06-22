# Social Media Connections

This application supports connecting to multiple social media platforms for analytics and management features.

## Supported Platforms

### Currently Implemented with OAuth
- **Instagram** - Basic Display API for post analytics and insights
- **Twitter/X** - OAuth 2.0 for tweet analytics and engagement tracking
- **Discord** - OAuth2 for server analytics and community management
- **GitHub** - OAuth for repository analytics and developer insights
- **Spotify** - OAuth for music listening analytics and playlist insights

### Simulated Connections
- **Facebook** - Page insights and post performance
- **LinkedIn** - Professional networking analytics
- **YouTube** - Video analytics and audience insights
- **Twitch** - Streaming analytics and viewer engagement
- **TikTok** - Short-form video analytics and trends
- **Reddit** - Post analytics and community engagement

## Features by Platform

### Instagram
- Post Analytics
- Story Insights
- Follower Demographics
- Engagement Tracking

### Twitter/X
- Tweet Analytics
- Follower Growth
- Engagement Metrics
- Trend Analysis

### Discord
- Server Analytics
- Member Activity
- Channel Insights
- Bot Integration

### GitHub
- Repository Analytics
- Contributions Tracking
- Code Insights
- Developer Metrics

### Spotify
- Listening Analytics
- Playlist Insights
- Music Preferences
- Listening Trends

## OAuth Implementation

The application uses OAuth 2.0 flows for secure authentication with social media platforms. Each platform has its own callback endpoint:

- `/api/auth/instagram/callback`
- `/api/auth/twitter/callback`
- `/api/auth/discord/callback`
- `/api/auth/github/callback`
- `/api/auth/spotify/callback`

## Environment Variables

To enable real OAuth connections, you'll need to set up the following environment variables:

```env
# Instagram Basic Display API
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Twitter OAuth 2.0
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Discord OAuth2
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Setup Instructions

1. **Register Applications**: Create developer accounts and register applications on each platform's developer portal
2. **Configure Callbacks**: Set the redirect URIs to your domain + `/api/auth/{platform}/callback`
3. **Environment Variables**: Add your client IDs and secrets to `.env.local`
4. **Test Connections**: Use the connect page to test OAuth flows

## Security Features

- OAuth tokens are encrypted and stored securely
- Users can disconnect accounts at any time
- Data is removed within 24 hours of disconnection
- Only public data and basic profile information is accessed
- No posting on behalf of users without permission

## Future Enhancements

- Add more social media platforms
- Implement webhook support for real-time updates
- Add data export functionality
- Create unified analytics dashboard
- Support for team/enterprise accounts 