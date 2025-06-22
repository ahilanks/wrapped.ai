"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Send, Instagram, Twitter, Facebook, Linkedin, Youtube, Twitch, Music, Github, Play, MessageCircle, ExternalLink } from "lucide-react"
import GoogleProfileButton from "./google-profile-button"

interface ProfilePageProps {
  user: { name: string; email: string } | null
  selectedUserId: string
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "upload" | "profile", userId?: string) => void
}

interface SocialAccount {
  platform: string
  username: string
  url: string
  icon: any
  color: string
  bgColor: string
  followers?: string
  verified?: boolean
}

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function ProfilePage({ user, selectedUserId, onLogout, onNavigate }: ProfilePageProps) {
  const [profileUser, setProfileUser] = useState<any>(null)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Mock user data based on selectedUserId
  useEffect(() => {
    const mockUsers = {
      "user-1": { name: "Alex Chen", bio: "AI enthusiast and machine learning researcher", location: "San Francisco, CA" },
      "user-2": { name: "Sarah Johnson", bio: "Creative writer exploring AI storytelling", location: "New York, NY" },
      "user-3": { name: "Mike Rodriguez", bio: "Full-stack developer passionate about AI integration", location: "Austin, TX" },
      "user-4": { name: "Emma Wilson", bio: "Data scientist and AI ethics advocate", location: "Seattle, WA" },
      "user-5": { name: "David Kim", bio: "Product manager focused on AI-powered solutions", location: "Boston, MA" },
      "user-6": { name: "Lisa Thompson", bio: "UX designer creating AI interfaces", location: "Portland, OR" },
      "user-7": { name: "James Brown", bio: "AI researcher and educator", location: "Chicago, IL" },
      "user-8": { name: "Maria Garcia", bio: "Startup founder in AI space", location: "Miami, FL" },
      "user-9": { name: "Tom Anderson", bio: "Tech blogger covering AI trends", location: "Denver, CO" },
      "user-10": { name: "Rachel Green", bio: "AI consultant and speaker", location: "Los Angeles, CA" },
      "user-11": { name: "Chris Lee", bio: "Open source AI contributor", location: "Toronto, Canada" },
      "user-12": { name: "Amanda White", bio: "AI policy researcher", location: "Washington, DC" }
    }

    const mockSocialAccounts: SocialAccount[] = [
      { platform: "Twitter", username: "@alexchen_ai", url: "https://twitter.com/alexchen_ai", icon: Twitter, color: "text-blue-400", bgColor: "bg-blue-900/20", followers: "12.5K", verified: true },
      { platform: "LinkedIn", username: "alex-chen-ai", url: "https://linkedin.com/in/alex-chen-ai", icon: Linkedin, color: "text-blue-500", bgColor: "bg-blue-900/20", followers: "8.2K" },
      { platform: "GitHub", username: "alexchen-ai", url: "https://github.com/alexchen-ai", icon: Github, color: "text-gray-300", bgColor: "bg-gray-900/20", followers: "3.1K" },
      { platform: "YouTube", username: "Alex Chen AI", url: "https://youtube.com/@alexchenai", icon: Youtube, color: "text-red-400", bgColor: "bg-red-900/20", followers: "45.2K" },
      { platform: "Instagram", username: "alexchen.ai", url: "https://instagram.com/alexchen.ai", icon: Instagram, color: "text-pink-400", bgColor: "bg-pink-900/20", followers: "6.8K" }
    ]

    setProfileUser(mockUsers[selectedUserId as keyof typeof mockUsers] || mockUsers["user-1"])
    setSocialAccounts(mockSocialAccounts)

    // Initialize chat with welcome message
    setChatMessages([
      {
        id: "1",
        text: `Hi! I'm ${mockUsers[selectedUserId as keyof typeof mockUsers]?.name || "Alex Chen"}'s AI assistant. How can I help you connect with them?`,
        sender: "bot",
        timestamp: new Date()
      }
    ])
  }, [selectedUserId])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "That's a great question! I'd be happy to help you connect.",
        "I can see you're interested in similar topics. Let me know if you'd like to collaborate!",
        "Thanks for reaching out! I'm always open to discussing AI and technology.",
        "I appreciate your interest! Feel free to ask me anything about my work.",
        "That sounds interesting! I'd love to hear more about your perspective.",
        "Great to meet someone with similar interests! What would you like to discuss?",
        "I'm excited to connect with fellow AI enthusiasts! How can we collaborate?",
        "Thanks for the message! I'm always looking for new connections in the AI space."
      ]

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: "bot",
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!profileUser) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading profile...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 shadow-lg border-b border-gray-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate("connect")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Connect</span>
              </Button>
              <h1 className="text-xl font-semibold text-white">{profileUser.name}'s Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <GoogleProfileButton user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Social Media Accounts */}
          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">{profileUser.name}</CardTitle>
                <CardDescription className="text-gray-300">{profileUser.bio}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">{profileUser.location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Accounts */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  <span>Social Media</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Connect with {profileUser.name} on their social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialAccounts.map((account, index) => {
                  const Icon = account.icon
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${account.bgColor}`}>
                          <Icon className={`h-5 w-5 ${account.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{account.platform}</span>
                            {account.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>{account.username}</span>
                            {account.followers && (
                              <>
                                <span>•</span>
                                <span>{account.followers} followers</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        onClick={() => window.open(account.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chatbot */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-green-400" />
                  <span>Chat with {profileUser.name}</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Ask questions and connect through AI
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-200"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 px-3 py-2"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isTyping}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 