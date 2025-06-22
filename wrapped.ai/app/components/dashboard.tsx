"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"
import ThreeScatterPlot from "./three-scatter-plot"
import ImageSlider from "./image-slider"
import GoogleProfileButton from "./google-profile-button"

interface DashboardProps {
  user: { name: string; email: string } | null
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

// Mock vector embeddings and documents for RAG
const mockDocuments = [
  {
    id: "doc1",
    title: "AI & Machine Learning Patterns",
    content: "The user shows strong interest in AI and machine learning topics, with 52% of their interactions focused on these areas. They frequently ask about neural networks, deep learning algorithms, and practical applications of AI in real-world scenarios.",
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
  },
  {
    id: "doc2", 
    title: "Programming & Code Analysis",
    content: "Programming and code-related queries make up 38% of interactions. The user often seeks help with Python programming, debugging, code optimization, and best practices for software development.",
    embedding: [0.2, 0.3, 0.4, 0.5, 0.6]
  },
  {
    id: "doc3",
    title: "Creative Writing & Content",
    content: "Creative writing represents 29% of the user's AI interactions. They frequently request help with storytelling, content creation, creative prompts, and writing techniques across various genres.",
    embedding: [0.3, 0.4, 0.5, 0.6, 0.7]
  },
  {
    id: "doc4",
    title: "Problem Solving Strategies",
    content: "Problem-solving queries account for 24% of interactions. The user often presents complex problems and seeks systematic approaches, analytical thinking methods, and step-by-step solutions.",
    embedding: [0.4, 0.5, 0.6, 0.7, 0.8]
  },
  {
    id: "doc5",
    title: "Learning & Education Patterns",
    content: "Learning and education topics represent 18% of interactions. The user frequently asks for explanations of complex concepts, study strategies, and educational resources across various subjects.",
    embedding: [0.5, 0.6, 0.7, 0.8, 0.9]
  },
  {
    id: "doc6",
    title: "ChatGPT Usage Statistics",
    content: "The user has sent 4,231 messages this year, with an average of 11.6 messages per day. Their current streak is 18 days, with a longest streak of 31 days. They are most active in the evening (7-10 PM) with 42% of their activity.",
    embedding: [0.6, 0.7, 0.8, 0.9, 1.0]
  },
  {
    id: "doc7",
    title: "Prompt Style Analysis",
    content: "The user's prompt style is primarily code requests (45%), followed by questions (32%), analysis requests (15%), brainstorming (6%), and creative prompts (2%). They tend to be direct and specific in their requests.",
    embedding: [0.7, 0.8, 0.9, 1.0, 1.1]
  }
]

// Simple cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Mock function to generate embeddings for user queries
function generateQueryEmbedding(query: string): number[] {
  // Simple hash-based embedding for demo purposes
  const hash = query.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return [
    Math.sin(hash) * 0.5 + 0.5,
    Math.cos(hash) * 0.5 + 0.5,
    Math.sin(hash * 2) * 0.5 + 0.5,
    Math.cos(hash * 2) * 0.5 + 0.5,
    Math.sin(hash * 3) * 0.5 + 0.5
  ]
}

// RAG function to retrieve relevant documents
function retrieveRelevantDocuments(query: string, topK: number = 3) {
  const queryEmbedding = generateQueryEmbedding(query.toLowerCase())
  
  const similarities = mockDocuments.map(doc => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }))
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(doc => ({
      title: doc.title,
      content: doc.content,
      similarity: doc.similarity
    }))
}

export default function Dashboard({ user, onLogout, onNavigate }: DashboardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

    // Retrieve relevant documents using RAG
    const relevantDocs = retrieveRelevantDocuments(newMessage)

    // Generate response based on retrieved documents
    setTimeout(() => {
      let response = ""
      let sources = relevantDocs

      // Generate contextual response based on query and retrieved documents
      const query = newMessage.toLowerCase()
      
      if (query.includes("pattern") || query.includes("usage") || query.includes("statistic")) {
        response = `Based on your ChatGPT usage patterns, I can see that you're most active in the evening (7-10 PM) with 42% of your activity. You've sent 4,231 messages this year with an average of 11.6 messages per day. Your current streak is 18 days, and your longest streak was 31 days.`
      } else if (query.includes("ai") || query.includes("machine learning")) {
        response = `Your interactions show a strong focus on AI and machine learning topics, accounting for 52% of your ChatGPT usage. You frequently ask about neural networks, deep learning algorithms, and practical AI applications. This suggests you're deeply engaged in AI research and development.`
      } else if (query.includes("programming") || query.includes("code")) {
        response = `Programming and code-related queries make up 38% of your interactions. You often seek help with Python programming, debugging, code optimization, and software development best practices. Your most discussed programming topic is Python with 203 chats.`
      } else if (query.includes("creative") || query.includes("writing")) {
        response = `Creative writing represents 29% of your AI interactions. You frequently request help with storytelling, content creation, creative prompts, and writing techniques across various genres. This shows a strong creative side to your AI usage.`
      } else if (query.includes("problem") || query.includes("solve")) {
        response = `Problem-solving queries account for 24% of your interactions. You often present complex problems and seek systematic approaches, analytical thinking methods, and step-by-step solutions. This indicates a methodical approach to using AI.`
      } else {
        response = `I can help you understand your ChatGPT usage patterns and provide insights about your interactions. You can ask me about your usage statistics, topic preferences, activity patterns, or any specific questions about your AI interactions.`
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined
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
                className="bg-purple-600 hover:bg-purple-700 hover:bg-gray-500"//"border-gray-600 text-gray-400 bg-gray-800 hover:bg-white hover:text-gray-900 rounded-full transition-colors"
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
                    <p className="text-sm">{message.text}</p>
                  </div>
                  
                  {/* Show sources for bot messages */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p className="mb-1">Sources:</p>
                      {message.sources.map((source, index) => (
                        <div key={index} className="mb-1 p-2 bg-gray-900/50 rounded border border-gray-600">
                          <p className="font-medium text-gray-300">{source.title}</p>
                          <p className="text-gray-500">{source.content.substring(0, 100)}...</p>
                          <p className="text-purple-400">Similarity: {(source.similarity * 100).toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                  )}
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

