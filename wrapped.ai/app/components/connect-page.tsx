"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Search, Filter, Users, TrendingUp, MessageCircle } from "lucide-react"
import ThreeScatterPlot from "./three-scatter-plot"
import GoogleProfileButton from "./google-profile-button"

interface ConnectPageProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "upload" | "profile", userId?: string) => void
}

interface UserMindmap {
  id: string
  name: string
  similarity: number
  data: {
    topGenres: Array<{ name: string; value: string; percentage: number }>
    mostDiscussed: Array<{ name: string; value: string; percentage: number }>
    chatStreak: Array<{ name: string; value: string; percentage: number }>
    totalMessages: Array<{ name: string; value: string; percentage: number }>
    promptStyles: Array<{ name: string; value: string; percentage: number }>
    topTimeOfDay: Array<{ name: string; value: string; percentage: number }>
  }
}

export default function ConnectPage({ user, onLogout, onNavigate }: ConnectPageProps) {
  const [mindmaps, setMindmaps] = useState<UserMindmap[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"similarity" | "name">("similarity")

  // Generate mock data for other users' mindmaps
  useEffect(() => {
    const mockUsers = [
      { name: "Alex Chen", similarity: 95 },
      { name: "Sarah Johnson", similarity: 87 },
      { name: "Mike Rodriguez", similarity: 82 },
      { name: "Emma Wilson", similarity: 78 },
      { name: "David Kim", similarity: 73 },
      { name: "Lisa Thompson", similarity: 69 },
      { name: "James Brown", similarity: 64 },
      { name: "Maria Garcia", similarity: 58 },
      { name: "Tom Anderson", similarity: 52 },
      { name: "Rachel Green", similarity: 47 },
      { name: "Chris Lee", similarity: 41 },
      { name: "Amanda White", similarity: 35 }
    ]

    const generateMindmapData = (userName: string) => ({
      topGenres: [
        { name: "AI & Machine Learning", value: `${Math.floor(Math.random() * 60) + 20}%`, percentage: Math.floor(Math.random() * 60) + 20 },
        { name: "Programming & Code", value: `${Math.floor(Math.random() * 50) + 15}%`, percentage: Math.floor(Math.random() * 50) + 15 },
        { name: "Creative Writing", value: `${Math.floor(Math.random() * 40) + 10}%`, percentage: Math.floor(Math.random() * 40) + 10 },
        { name: "Problem Solving", value: `${Math.floor(Math.random() * 35) + 8}%`, percentage: Math.floor(Math.random() * 35) + 8 },
        { name: "Learning & Education", value: `${Math.floor(Math.random() * 30) + 5}%`, percentage: Math.floor(Math.random() * 30) + 5 }
      ],
      mostDiscussed: [
        { name: "Python Programming", value: `${Math.floor(Math.random() * 300) + 100} chats`, percentage: Math.floor(Math.random() * 40) + 60 },
        { name: "Machine Learning", value: `${Math.floor(Math.random() * 250) + 80} chats`, percentage: Math.floor(Math.random() * 35) + 55 },
        { name: "Web Development", value: `${Math.floor(Math.random() * 200) + 60} chats`, percentage: Math.floor(Math.random() * 30) + 50 },
        { name: "Data Analysis", value: `${Math.floor(Math.random() * 180) + 50} chats`, percentage: Math.floor(Math.random() * 25) + 45 },
        { name: "Creative Writing", value: `${Math.floor(Math.random() * 150) + 40} chats`, percentage: Math.floor(Math.random() * 20) + 40 }
      ],
      chatStreak: [
        { name: "Current Streak", value: `${Math.floor(Math.random() * 30) + 5} days`, percentage: 100 },
        { name: "Longest Ever", value: `${Math.floor(Math.random() * 50) + 15} days`, percentage: 100 },
        { name: "This Month", value: `${Math.floor(Math.random() * 25) + 10} days`, percentage: Math.floor(Math.random() * 40) + 50 },
        { name: "Last Month", value: `${Math.floor(Math.random() * 20) + 8} days`, percentage: Math.floor(Math.random() * 35) + 40 },
        { name: "Average", value: `${Math.floor(Math.random() * 15) + 5} days`, percentage: Math.floor(Math.random() * 30) + 30 }
      ],
      totalMessages: [
        { name: "This Year", value: `${Math.floor(Math.random() * 5000) + 1000}`, percentage: 100 },
        { name: "This Month", value: `${Math.floor(Math.random() * 800) + 200}`, percentage: Math.floor(Math.random() * 20) + 10 },
        { name: "This Week", value: `${Math.floor(Math.random() * 200) + 50}`, percentage: Math.floor(Math.random() * 10) + 2 },
        { name: "Today", value: `${Math.floor(Math.random() * 50) + 10}`, percentage: Math.floor(Math.random() * 5) + 0.5 },
        { name: "Average/Day", value: `${(Math.random() * 20 + 5).toFixed(1)}`, percentage: Math.floor(Math.random() * 3) + 0.2 }
      ],
      promptStyles: [
        { name: "Code Requests", value: `${Math.floor(Math.random() * 60) + 20}%`, percentage: Math.floor(Math.random() * 60) + 20 },
        { name: "Questions", value: `${Math.floor(Math.random() * 50) + 15}%`, percentage: Math.floor(Math.random() * 50) + 15 },
        { name: "Analysis", value: `${Math.floor(Math.random() * 40) + 10}%`, percentage: Math.floor(Math.random() * 40) + 10 },
        { name: "Brainstorming", value: `${Math.floor(Math.random() * 30) + 5}%`, percentage: Math.floor(Math.random() * 30) + 5 },
        { name: "Creative", value: `${Math.floor(Math.random() * 20) + 2}%`, percentage: Math.floor(Math.random() * 20) + 2 }
      ],
      topTimeOfDay: [
        { name: "Evening (7-10 PM)", value: `${Math.floor(Math.random() * 60) + 20}%`, percentage: Math.floor(Math.random() * 60) + 20 },
        { name: "Afternoon (2-5 PM)", value: `${Math.floor(Math.random() * 50) + 15}%`, percentage: Math.floor(Math.random() * 50) + 15 },
        { name: "Morning (9-12 AM)", value: `${Math.floor(Math.random() * 40) + 10}%`, percentage: Math.floor(Math.random() * 40) + 10 },
        { name: "Late Night (10-12 PM)", value: `${Math.floor(Math.random() * 30) + 5}%`, percentage: Math.floor(Math.random() * 30) + 5 },
        { name: "Early Morning (6-9 AM)", value: `${Math.floor(Math.random() * 20) + 2}%`, percentage: Math.floor(Math.random() * 20) + 2 }
      ]
    })

    const mockMindmaps: UserMindmap[] = mockUsers.map((mockUser, index) => ({
      id: `user-${index + 1}`,
      name: mockUser.name,
      similarity: mockUser.similarity,
      data: generateMindmapData(mockUser.name)
    }))

    setMindmaps(mockMindmaps)
  }, [])

  const filteredAndSortedMindmaps = mindmaps
    .filter(mindmap => 
      mindmap.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "similarity") {
        return b.similarity - a.similarity
      } else {
        return a.name.localeCompare(b.name)
      }
    })

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 shadow-lg border-b border-gray-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onNavigate("dashboard")}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-white">Connect with Others</h1>
            </div>
            {/* <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user?.name}</span>
              <Button onClick={onLogout} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Logout
              </Button>
            </div> */}
            <div className="flex items-center space-x-4">
              <GoogleProfileButton user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setSortBy("similarity")}
                variant={sortBy === "similarity" ? "default" : "outline"}
                size="sm"
                className={sortBy === "similarity" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Similarity
              </Button>
              <Button
                onClick={() => setSortBy("name")}
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                className={sortBy === "name" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
              >
                <Users className="h-4 w-4 mr-2" />
                Name
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">{mindmaps.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Most Similar</p>
                    <p className="text-2xl font-bold text-white">{mindmaps.length > 0 ? mindmaps[0].name : "N/A"}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Similarity</p>
                    <p className="text-2xl font-bold text-white">
                      {mindmaps.length > 0 
                        ? Math.round(mindmaps.reduce((sum, m) => sum + m.similarity, 0) / mindmaps.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mindmaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedMindmaps.map((mindmap) => (
            <Card key={mindmap.id} className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{mindmap.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mindmap.similarity >= 80 ? 'bg-green-900/50 text-green-300 border border-green-700' :
                      mindmap.similarity >= 60 ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                      'bg-red-900/50 text-red-300 border border-red-700'
                    }`}>
                      {mindmap.similarity}% similar
                    </div>
                    <Button
                      onClick={() => onNavigate("profile", mindmap.id)}
                      variant="outline"
                      size="sm"
                      className="border-purple-500 text-purple-300 hover:bg-purple-600/20 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Poke
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-300">
                  AI interaction patterns and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px] rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700">
                  <ThreeScatterPlot customData={mindmap.data} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedMindmaps.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters</p>
          </div>
        )}
      </main>
    </div>
  )
}
