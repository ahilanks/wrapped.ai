"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"
import ThreeScatterPlot from "./three-scatter-plot"
import ImageSlider from "./image-slider"
import GoogleProfileButton from "./google-profile-button"

interface DashboardProps {
  user: { name: string; email: string; id?: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "upload" | "profile", userId?: string) => void
}

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  sources?: Array<{ title: string; content: string; similarity: number }>
}

// Example custom data - you can replace this with your actual data
const customData = {
  topGenres: [
    { name: "AI & Machine Learning", value: "52%", percentage: 52 },
    { name: "Programming & Code", value: "38%", percentage: 38 },
    { name: "Creative Writing", value: "29%", percentage: 29 },
    { name: "Problem Solving", value: "24%", percentage: 24 },
    { name: "Learning & Education", value: "18%", percentage: 18 }
  ],
  mostDiscussed: [
    { name: "Python Programming", value: "203 chats", percentage: 95 },
    { name: "Machine Learning", value: "187 chats", percentage: 88 },
    { name: "Web Development", value: "156 chats", percentage: 73 },
    { name: "Data Analysis", value: "134 chats", percentage: 63 },
    { name: "Creative Writing", value: "98 chats", percentage: 46 }
  ],
  chatStreak: [
    { name: "Current Streak", value: "18 days", percentage: 100 },
    { name: "Longest Ever", value: "31 days", percentage: 100 },
    { name: "This Month", value: "22 days", percentage: 71 },
    { name: "Last Month", value: "19 days", percentage: 61 },
    { name: "Average", value: "12 days", percentage: 39 }
  ],
  totalMessages: [
    { name: "This Year", value: "4,231", percentage: 100 },
    { name: "This Month", value: "567", percentage: 13 },
    { name: "This Week", value: "134", percentage: 3 },
    { name: "Today", value: "23", percentage: 0.5 },
    { name: "Average/Day", value: "11.6", percentage: 0.3 }
  ],
  promptStyles: [
    { name: "Code Requests", value: "45%", percentage: 45 },
    { name: "Questions", value: "32%", percentage: 32 },
    { name: "Analysis", value: "15%", percentage: 15 },
    { name: "Brainstorming", value: "6%", percentage: 6 },
    { name: "Creative", value: "2%", percentage: 2 }
  ],
  topTimeOfDay: [
    { name: "Evening (7-10 PM)", value: "42%", percentage: 42 },
    { name: "Afternoon (2-5 PM)", value: "28%", percentage: 28 },
    { name: "Morning (9-12 AM)", value: "18%", percentage: 18 },
    { name: "Late Night (10-12 PM)", value: "8%", percentage: 8 },
    { name: "Early Morning (6-9 AM)", value: "4%", percentage: 4 }
  ]
}

export default function Dashboard({ user, onLogout, onNavigate }: DashboardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  console.log(chatMessages)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Initialize chat with welcome message
  useEffect(() => {
    if (isChatOpen && chatMessages.length === 0) {
      setChatMessages([
        {
          id: "1",
          text: "Hi! I'm your AI assistant with access to your ChatGPT usage data. I can help you understand your patterns, answer questions about your interactions, and provide insights. What would you like to know?",
          sender: "bot",
          timestamp: new Date()
        }
      ])
    }
  }, [isChatOpen, chatMessages.length])

  // Function to generate embeddings using Voyage AI
  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  // Function to search for relevant documents
  const searchDocuments = async (queryEmbedding: number[]): Promise<any> => {
    try {
      const response = await fetch('/api/similarity-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          queryEmbedding, 
          userEmail: user?.email,
          topK: 3 
        })
      })

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`Similarity for log ${data.id}:`, data.similarity);
      return data
    } catch (error) {
      console.error('Error searching documents:', error)
      return { documents: [], bestBody: '' }
    }
  }

  // Function to get Claude AI response
  const getClaudeResponse = async (query: string, context: string, conversationHistory: any[]): Promise<string> => {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query, 
          context, 
          conversationHistory 
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error getting Claude response:', error)
      throw error
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    try {
      // Generate embedding for the user's query
      const queryEmbedding = await generateEmbedding(newMessage)
      
      // Search for relevant documents and bestBody
      const { documents: relevantDocs, bestBody } = await searchDocuments(queryEmbedding)
      
      // Use bestBody as main context for Claude, and ask for summary and highlights
      const context = bestBody && typeof bestBody === 'string' && bestBody.length > 0
        ? `Here is the most relevant document from your history:\n\n${bestBody}\n\nUser question: ${newMessage}\n\nPlease provide a summary and key highlights of this content, and answer the user's question if possible.`
        : (relevantDocs.length > 0
            ? (relevantDocs[0].body ?? '')
            : "No specific context available. You can provide general assistance based on your knowledge about ChatGPT usage patterns and AI interactions.")

      // Prepare conversation history for Claude
      const conversationHistory = chatMessages
        .filter(msg => msg.sender === "user" || msg.sender === "bot")
        .map(msg => ({
          role: msg.sender === "user" ? "user" as const : "assistant" as const,
          content: msg.text
        }))
        .slice(-10) // Keep last 10 messages for context

      // Get response from Claude AI
      const claudeResponse = await getClaudeResponse(newMessage, context, conversationHistory)

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: claudeResponse,
        sender: "bot",
        timestamp: new Date(),
        sources: relevantDocs.length > 0 ? relevantDocs : undefined
      }

      setChatMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error processing message:', error)
      
      // Fallback response if APIs fail
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again later or check your internet connection.",
        sender: "bot",
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 shadow-lg border-b border-gray-700 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>
            <div className="flex-1 flex justify-center">
              <Button
                onClick={() => onNavigate("connect")}
                variant="outline"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 hover:bg-gray-500"
              >
                Connect With Others!
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <GoogleProfileButton user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 3D Scatter Plot Section */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">3D Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700">
                <ThreeScatterPlot />
              </div>
            </CardContent>
          </Card>

          {/* Image Slider Section */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">ChatGPT Wrapped!</CardTitle>
              <CardDescription className="text-gray-300">Scroll to see your ChatGPT stats this year!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <ImageSlider data={customData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Chatbot Popup */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-purple-400" />
              <span className="text-white font-medium">AI Assistant</span>
            </div>
            <Button
              onClick={() => setIsChatOpen(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-xs">
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    {/* Format bot message: lines starting with '#' as h2, others as normal text */}
                    {message.sender === "bot" ? (
                      <div>
                        {message.text.split('\n').map((line, idx) => {
                          if (line.trim().startsWith('#')) {
                            return (
                              <div key={idx} className="text-lg font-bold mt-2 mb-1">
                                {line.replace(/^#+\s*/, '')}
                              </div>
                            )
                          } else {
                            return (
                              <div key={idx} className="mb-1">
                                {line}
                              </div>
                            )
                          }
                        })}
                      </div>
                    ) : (
                      <p className="text-sm">{message.text}</p>
                    )}
                  </div>
                  
                  {/* Show sources for bot messages */}
                  {/* {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p className="mb-1">Sources:</p>
                      {message.sources.map((source, index) => (
                        <div key={index} className="mb-1 p-2 bg-gray-900/50 rounded border border-gray-600">
                          <p className="font-medium text-gray-300">{source.title}</p>
                          <p className="text-gray-500">{source.content}...</p>
                          <p className="text-purple-400">Similarity: {(source.similarity * 100).toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                  )} */}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your ChatGPT data..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg z-40"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

