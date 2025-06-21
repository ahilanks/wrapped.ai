"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Instagram, MessageCircle, ExternalLink } from "lucide-react"

interface ConnectPageProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "marketplace") => void
}

interface ConnectionStatus {
  instagram: boolean
  discord: boolean
  reddit: boolean
}

export default function ConnectPage({ user, onLogout, onNavigate }: ConnectPageProps) {
  const [connections, setConnections] = useState<ConnectionStatus>({
    instagram: false,
    discord: false,
    reddit: false,
  })

  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  const handleConnect = async (platform: keyof ConnectionStatus) => {
    setIsConnecting(platform)

    // Simulate connection process
    setTimeout(() => {
      setConnections((prev) => ({
        ...prev,
        [platform]: !prev[platform],
      }))
      setIsConnecting(null)
    }, 2000)
  }

  const platforms = [
    {
      id: "instagram" as keyof ConnectionStatus,
      name: "Instagram",
      description: "Connect your Instagram account to sync posts and analytics",
      icon: Instagram,
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      id: "discord" as keyof ConnectionStatus,
      name: "Discord",
      description: "Link your Discord server for community management",
      icon: MessageCircle,
      color: "from-indigo-500 to-purple-500",
      textColor: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
    {
      id: "reddit" as keyof ConnectionStatus,
      name: "Reddit",
      description: "Connect Reddit to monitor discussions and engagement",
      icon: ExternalLink,
      color: "from-orange-500 to-red-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ]

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
              <Button
                onClick={() => onNavigate("marketplace")}
                variant="outline"
                size="sm"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                Marketplace
              </Button>
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button onClick={onLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <CardDescription>Overview of your connected accounts</CardDescription>
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
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {platforms.map((platform) => {
            const Icon = platform.icon
            const isConnected = connections[platform.id]
            const isLoading = isConnecting === platform.id

            return (
              <Card key={platform.id} className={`transition-all hover:shadow-md ${platform.borderColor}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${platform.bgColor}`}>
                        <Icon className={`h-6 w-6 ${platform.textColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{platform.name}</h3>
                        <p className="text-sm text-gray-600">{platform.description}</p>
                        {isConnected && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600 font-medium">Connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isLoading}
                      variant={isConnected ? "outline" : "default"}
                      className={
                        isConnected
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : `bg-gradient-to-r ${platform.color} text-white hover:opacity-90`
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
                  </div>
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
                permission.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I disconnect anytime?</h4>
              <p className="text-sm text-gray-600">
                Yes, you can disconnect any account at any time. Your data will be removed from our systems within 24
                hours.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Is my data secure?</h4>
              <p className="text-sm text-gray-600">
                We use industry-standard encryption and security practices to protect your data and connections.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
