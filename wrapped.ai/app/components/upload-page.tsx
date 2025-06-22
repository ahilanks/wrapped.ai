"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Play, ExternalLink, AlertCircle, ArrowLeft, UploadCloud, FileJson, X, CheckCircle } from "lucide-react"

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
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/json") {
        setFile(selectedFile)
        setUploadStatus('idle')
        setErrorMessage('')
      } else {
        setErrorMessage("Please select a valid JSON file.")
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !user?.email) {
      setErrorMessage("No file selected or user not logged in.")
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    const formData = new FormData()
    formData.append("file", file)
    formData.append("email", user.email)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setUploadStatus('success')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || "An unknown error occurred.")
        setUploadStatus('error')
      }
    } catch (err) {
      setErrorMessage("Failed to connect to the server.")
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Upload Your Data</h1>
        <div className="w-10"></div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-lg bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Upload ChatGPT Export</CardTitle>
            <CardDescription>
              Upload your `conversations.json` file to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
              <UploadCloud className="h-12 w-12 text-gray-500 mb-4" />
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="application/json"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {isUploading ? "Uploading..." : "Select conversations.json"}
              </label>
              <p className="text-xs text-gray-400 mt-2">
                Only JSON files are accepted.
              </p>
            </div>

            {file && (
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileJson className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700"
            >
              {isUploading ? "Processing..." : "Upload and Process"}
            </Button>
            
            {uploadStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-900/50 text-green-300 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5" />
                <p>Upload successful! Your data is being processed in the background.</p>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg">
                <p>Error: {errorMessage}</p>
              </div>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  )
} 