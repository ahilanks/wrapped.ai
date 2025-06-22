"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Instagram, 
  MessageCircle, 
  ExternalLink, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Twitch, 
  Music,
  Github,
  Play,
  CheckCircle,
  XCircle
} from "lucide-react"

interface ConnectPageProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect") => void
}

interface ConnectionStatus {
  instagram: boolean
  discord: boolean
  reddit: boolean
  twitter: boolean
  facebook: boolean
  linkedin: boolean
  youtube: boolean
  twitch: boolean
  tiktok: boolean
  github: boolean
  spotify: boolean
}

interface PlatformData {
  id: keyof ConnectionStatus
  name: string
  description: string
  icon: any
  color: string
  textColor: string
  bgColor: string
  borderColor: string
  oauthUrl?: string
  features: string[]
}

export default function ConnectPage({ user, onLogout, onNavigate }: ConnectPageProps) {
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<ConnectionStatus>({
    instagram: false,
    discord: false,
    reddit: false,
    twitter: false,
    facebook: false,
    linkedin: false,
    youtube: false,
    twitch: false,
    tiktok: false,
    github: false,
    spotify: false,
  })

  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [connectionData, setConnectionData] = useState<Record<string, any>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      setMessage({ type: 'success', text: `Successfully connected to ${success}!` })
      setConnections(prev => ({ ...prev, [success]: true }))
      setConnectionData(prev => ({
        ...prev,
        [success]: {
          connectedAt: new Date().toISOString(),
          username: `user_${success}_${Date.now()}`,
          followers: Math.floor(Math.random() * 10000),
          posts: Math.floor(Math.random() * 1000),
        }
      }))
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    }

    if (error) {
      setMessage({ type: 'error', text: `Failed to connect: ${error.replace(/_/g, ' ')}` })
      setTimeout(() => setMessage(null), 5000)
    }
  }, [searchParams])

  const handleConnect = async (platform: keyof ConnectionStatus) => {
    setIsConnecting(platform)

    try {
      // Simulate OAuth flow for different platforms
      if (platform === 'instagram') {
        // Instagram Basic Display API
        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || 'demo'}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/instagram/callback')}&scope=user_profile,user_media&response_type=code`
        window.open(authUrl, '_blank', 'width=600,height=600')
      } else if (platform === 'twitter') {
        // Twitter OAuth 2.0
        const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || 'demo'}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/twitter/callback')}&scope=tweet.read%20users.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain`
        window.open(authUrl, '_blank', 'width=600,height=600')
      } else if (platform === 'discord') {
        // Discord OAuth2
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || 'demo'}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/discord/callback')}&response_type=code&scope=identify%20guilds`
        window.open(authUrl, '_blank', 'width=600,height=600')
      } else if (platform === 'github') {
        // GitHub OAuth
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'demo'}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/github/callback')}&scope=read:user%20user:email`
        window.open(authUrl, '_blank', 'width=600,height=600')
      } else if (platform === 'spotify') {
        // Spotify OAuth
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || 'demo'}&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/spotify/callback')}&scope=user-read-private%20user-read-email%20user-top-read`
        window.open(authUrl, '_blank', 'width=600,height=600')
      } else {
        // For other platforms, simulate connection
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Simulate successful connection for non-OAuth platforms
      if (!['instagram', 'twitter', 'discord', 'github', 'spotify'].includes(platform)) {
        setTimeout(() => {
          setConnections((prev) => ({
            ...prev,
            [platform]: !prev[platform],
          }))
          
          // Store connection data
          setConnectionData(prev => ({
            ...prev,
            [platform]: {
              connectedAt: new Date().toISOString(),
              username: `user_${platform}_${Date.now()}`,
              followers: Math.floor(Math.random() * 10000),
              posts: Math.floor(Math.random() * 1000),
            }
          }))
          
          setIsConnecting(null)
        }, 2000)
      } else {
        // For OAuth platforms, don't set connection immediately - wait for callback
        setIsConnecting(null)
      }
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error)
      setIsConnecting(null)
      setMessage({ type: 'error', text: `Failed to connect to ${platform}` })
    }
  }

  const platforms: PlatformData[] = [
    {
      id: "instagram",
      name: "Instagram",
      description: "Connect your Instagram account to sync posts, stories, and analytics",
      icon: Instagram,
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: ["Post Analytics", "Story Insights", "Follower Demographics", "Engagement Tracking"]
    },
    {
      id: "twitter",
      name: "Twitter/X",
      description: "Link your Twitter account for tweet analytics and engagement tracking",
      icon: Twitter,
      color: "from-blue-400 to-blue-600",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: ["Tweet Analytics", "Follower Growth", "Engagement Metrics", "Trend Analysis"]
    },
    {
      id: "discord",
      name: "Discord",
      description: "Connect your Discord server for community management and analytics",
      icon: MessageCircle,
      color: "from-indigo-500 to-purple-500",
      textColor: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      features: ["Server Analytics", "Member Activity", "Channel Insights", "Bot Integration"]
    },
    {
      id: "reddit",
      name: "Reddit",
      description: "Connect Reddit to monitor discussions, karma, and community engagement",
      icon: ExternalLink,
      color: "from-orange-500 to-red-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      features: ["Post Analytics", "Karma Tracking", "Subreddit Insights", "Comment Analysis"]
    },
    {
      id: "facebook",
      name: "Facebook",
      description: "Link your Facebook page for comprehensive social media analytics",
      icon: Facebook,
      color: "from-blue-600 to-blue-800",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: ["Page Insights", "Post Performance", "Audience Demographics", "Reach Analytics"]
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Connect LinkedIn for professional networking analytics and content insights",
      icon: Linkedin,
      color: "from-blue-700 to-blue-900",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: ["Profile Analytics", "Post Performance", "Network Growth", "Professional Insights"]
    },
    {
      id: "youtube",
      name: "YouTube",
      description: "Connect YouTube channel for video analytics and audience insights",
      icon: Youtube,
      color: "from-red-500 to-red-700",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      features: ["Video Analytics", "Subscriber Growth", "Watch Time", "Audience Retention"]
    },
    {
      id: "twitch",
      name: "Twitch",
      description: "Link Twitch channel for streaming analytics and viewer engagement",
      icon: Twitch,
      color: "from-purple-600 to-purple-800",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: ["Stream Analytics", "Viewer Metrics", "Chat Analysis", "Revenue Tracking"]
    },
    {
      id: "tiktok",
      name: "TikTok",
      description: "Connect TikTok account for short-form video analytics and trends",
      icon: Music,
      color: "from-pink-500 to-purple-500",
      textColor: "text-pink-700",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      features: ["Video Performance", "Follower Growth", "Trend Analysis", "Engagement Metrics"]
    },
    {
      id: "github",
      name: "GitHub",
      description: "Connect GitHub for developer analytics and repository insights",
      icon: Github,
      color: "from-gray-700 to-gray-900",
      textColor: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      features: ["Repository Analytics", "Contributions Tracking", "Code Insights", "Developer Metrics"]
    },
    {
      id: "spotify",
      name: "Spotify",
      description: "Link Spotify for music listening analytics and playlist insights",
      icon: Play,
      color: "from-green-500 to-green-700",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      features: ["Listening Analytics", "Playlist Insights", "Music Preferences", "Listening Trends"]
    },
  ]

  const connectedCount = Object.values(connections).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate("dashboard")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Connect Accounts</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button onClick={onLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Social Accounts</h2>
          <p className="text-gray-600">
            Link your social media accounts to unlock powerful analytics and management features.
          </p>
        </div>

        {/* Connection Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              {connectedCount} of {platforms.length} accounts connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Badge
                  key={platform.id}
                  variant={connections[platform.id] ? "default" : "secondary"}
                  className={connections[platform.id] ? "bg-green-100 text-green-800" : ""}
                >
                  {platform.name}: {connections[platform.id] ? "Connected" : "Not Connected"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const Icon = platform.icon
            const isConnected = connections[platform.id]
            const isLoading = isConnecting === platform.id
            const data = connectionData[platform.id]

            return (
              <Card key={platform.id} className={`transition-all hover:shadow-md ${platform.borderColor}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${platform.bgColor}`}>
                        <Icon className={`h-6 w-6 ${platform.textColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{platform.name}</h3>
                        <p className="text-sm text-gray-600">{platform.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  {isConnected && data && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">Connected</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Username: {data.username}</div>
                        <div>Followers: {data.followers.toLocaleString()}</div>
                        <div>Posts: {data.posts.toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                    <div className="space-y-1">
                      {platform.features.map((feature, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-center">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connect Button */}
                  <Button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isLoading}
                    variant={isConnected ? "outline" : "default"}
                    className={
                      isConnected
                        ? "w-full border-red-200 text-red-700 hover:bg-red-50"
                        : `w-full bg-gradient-to-r ${platform.color} text-white hover:opacity-90`
                    }
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </div>
                    ) : isConnected ? (
                      "Disconnect"
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Common questions about connecting your accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">What data do we access?</h4>
              <p className="text-sm text-gray-600">
                We only access public data and basic profile information. We never post on your behalf without
                permission. Each platform has specific permissions that you can review during the connection process.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I disconnect anytime?</h4>
              <p className="text-sm text-gray-600">
                Yes, you can disconnect any account at any time. Your data will be removed from our systems within 24
                hours, and we'll revoke all access tokens.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Is my data secure?</h4>
              <p className="text-sm text-gray-600">
                We use industry-standard encryption and security practices to protect your data and connections.
                All OAuth tokens are encrypted and stored securely.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Which platforms are supported?</h4>
              <p className="text-sm text-gray-600">
                We support major social media platforms including Instagram, Twitter, Discord, Reddit, Facebook, 
                LinkedIn, YouTube, Twitch, TikTok, GitHub, and Spotify. More platforms are being added regularly.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
