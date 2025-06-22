"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react"

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  sources?: Array<{ title: string; content: string; similarity: number }>
}

interface RAGChatbotProps {
  documents?: Array<{
    id: string
    title: string
    content: string
    embedding: number[]
  }>
  welcomeMessage?: string
  placeholder?: string
  className?: string
  userId?: string
}

// Function to generate embeddings using Claude
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Embedding API error:', response.status, errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.embedding) {
      throw new Error('No embedding returned from API')
    }

    return data.embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    
    // Fallback to simple hash-based embedding
    console.log('Using fallback embedding generation...')
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    // Create a 1536-dimensional fallback embedding
    const fallbackEmbedding = []
    for (let i = 0; i < 1536; i++) {
      fallbackEmbedding.push(Math.sin(hash + i) * 0.5 + 0.5)
    }
    
    return fallbackEmbedding
  }
}

// Function to search for similar documents in Supabase
async function searchSimilarDocuments(query: string, userId?: string, topK: number = 3) {
  try {
    const queryEmbedding = await generateEmbedding(query)
    
    const response = await fetch('/api/similarity-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        queryEmbedding, 
        userId,
        topK 
      })
    })

    if (!response.ok) {
      throw new Error('Failed to search documents')
    }

    const data = await response.json()
    return data.documents
  } catch (error) {
    console.error('Error searching documents:', error)
    return []
  }
}

// Function to get response from Claude
async function getClaudeResponse(query: string, context: string, conversationHistory: ChatMessage[]) {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      })
    })

    if (!response.ok) {
        console.log(response)
      throw new Error('Failed to get Claude response')
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error('Error getting Claude response:', error)
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later."
  }
}

export default function RAGChatbot({ 
  documents = [], 
  welcomeMessage = "Hi! I'm your AI assistant. How can I help you?",
  placeholder = "Ask me anything...",
  className = "",
  userId
}: RAGChatbotProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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
          text: welcomeMessage,
          sender: "bot",
          timestamp: new Date()
        }
      ])
    }
  }, [isChatOpen, chatMessages.length, welcomeMessage])

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
      // Search for similar documents using Supabase
      const relevantDocs = await searchSimilarDocuments(newMessage, userId, 3)
      
      // Prepare context from relevant documents
      const context = relevantDocs.length > 0 
        ? relevantDocs.map((doc: any) => `${doc.title}: ${doc.content}`).join('\n\n')
        : documents.length > 0 
          ? documents.map(doc => `${doc.title}: ${doc.content}`).join('\n\n')
          : "No specific context available."

      // Get response from Claude
      const claudeResponse = await getClaudeResponse(
        newMessage, 
        context, 
        chatMessages
      )

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: claudeResponse,
        sender: "bot",
        timestamp: new Date(),
        sources: relevantDocs.length > 0 ? relevantDocs : undefined
      }

      setChatMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error in chat:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sender: "bot",
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, errorMessage])
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
    <>
      {/* Chatbot Popup */}
      {isChatOpen && (
        <div className={`fixed bottom-4 right-4 w-96 h-[500px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col ${className}`}>
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
                placeholder={placeholder}
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
    </>
  )
} 