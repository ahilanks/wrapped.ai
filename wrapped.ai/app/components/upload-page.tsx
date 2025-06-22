"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Play, ExternalLink, AlertCircle } from "lucide-react"

interface TutorialPageProps {
  user: { name: string; email: string } | null
  onLogout: () => void
  onNavigate: (page: "dashboard" | "connect" | "upload" | "profile", userId?: string) => void
}

interface Dot {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

export default function TutorialPage({ user, onLogout, onNavigate }: TutorialPageProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dots, setDots] = useState<Dot[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  // Initialize dots
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialDots: Dot[] = []
      for (let i = 0; i < 350; i++) {
        initialDots.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.1
        })
      }
      setDots(initialDots)
    }
  }, [])

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Animate dots
  useEffect(() => {
    const animate = () => {
      setDots(prevDots => prevDots.map(dot => {
        // Move dots towards cursor with some randomness
        const dx = mousePos.x - dot.x
        const dy = mousePos.y - dot.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 200) {
          // Attract dots to cursor
          dot.vx += dx * 0.0001
          dot.vy += dy * 0.0001
        }
        
        // Update position
        dot.x += dot.vx
        dot.y += dot.vy
        
        // Add some friction
        dot.vx *= 0.99
        dot.vy *= 0.99
        
        // Bounce off edges
        if (dot.x <= 0 || dot.x >= window.innerWidth) dot.vx *= -0.8
        if (dot.y <= 0 || dot.y >= window.innerHeight) dot.vy *= -0.8
        
        // Keep dots in bounds
        dot.x = Math.max(0, Math.min(window.innerWidth, dot.x))
        dot.y = Math.max(0, Math.min(window.innerHeight, dot.y))
        
        return dot
      }))
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePos])

  // Draw dots on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw dots
    dots.forEach(dot => {
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(147, 51, 234, ${dot.opacity})` // Purple color
      ctx.fill()
    })

    // Draw connections between nearby dots
    dots.forEach((dot1, i) => {
      dots.slice(i + 1).forEach(dot2 => {
        const dx = dot1.x - dot2.x
        const dy = dot1.y - dot2.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 100) {
          ctx.beginPath()
          ctx.moveTo(dot1.x, dot1.y)
          ctx.lineTo(dot2.x, dot2.y)
          ctx.strokeStyle = `rgba(147, 51, 234, ${0.1 * (1 - distance / 100)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
    })
  }, [dots])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setUploadError(null)
    
    if (file) {
      // Check if file is a ZIP file
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setUploadError('Please upload a ZIP file only. Other file types are not supported.')
        return
      }
      
      setUploadedFile(file)
      setIsUploading(true)
      
      // Simulate upload process
      setTimeout(() => {
        setIsUploading(false)
        // Here you can add actual upload logic to your backend
        console.log('File uploaded:', file.name)
        
        // Redirect to dashboard after successful upload
        setTimeout(() => {
          onNavigate("dashboard")
        }, 1000) // Small delay to show success state
      }, 2000)
    }
  }

  const handleTutorialClick = (tutorial: string) => {
    setSelectedTutorial(tutorial)
    // You can add actual video URLs here
    const videoUrls = {
      gpt: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual GPT tutorial
      claude: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Replace with actual Claude tutorial
    }
    
    if (videoUrls[tutorial as keyof typeof videoUrls]) {
      window.open(videoUrls[tutorial as keyof typeof videoUrls], '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Welcome to Wrapped.ai</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                Welcome, {user?.name || 'User'}!
              </span>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Upload Section */}
            <div className="space-y-6">
              <Card className="h-full bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Upload className="w-6 h-6 text-purple-400" />
                    <span>Upload Your Data</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Upload your ZIP file to start your personalized wrapped experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Error Message */}
                    {uploadError && (
                      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-300 text-sm font-medium">{uploadError}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors bg-gray-800/30">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".zip"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">
                          {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ZIP files only, up to 10MB
                        </p>
                      </label>
                    </div>
                    
                    {uploadedFile && (
                      <div className="p-3 bg-green-900/50 rounded-lg border border-green-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-green-300">
                            {isUploading ? "Uploading..." : "File uploaded successfully! Redirecting to dashboard..."}
                          </span>
                        </div>
                        {!isUploading && (
                          <p className="text-xs text-green-400 mt-1">
                            {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* <Button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isUploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Choose ZIP File to Upload
                        </>
                      )}
                    </Button> */}
                    
                    <p className="text-xs text-gray-500 text-center">
                      Your data is processed securely and never shared with third parties
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Video Tutorials */}
            <div className="space-y-6">
              <Card className="h-full bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Play className="w-6 h-6 text-green-400" />
                    <span>Video Tutorials</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Learn how to use AI tools effectively with our expert tutorials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* GPT Tutorial */}
                  <div 
                    className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleTutorialClick('gpt')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">GPT</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">GPT Tutorial</h3>
                          <p className="text-sm text-gray-300">
                            Master ChatGPT prompts and techniques
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Claude Tutorial */}
                  <div 
                    className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleTutorialClick('claude')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Claude Tutorial</h3>
                          <p className="text-sm text-gray-300">
                            Learn advanced Claude AI strategies
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 