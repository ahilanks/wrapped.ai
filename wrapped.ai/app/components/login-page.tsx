"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import OAuthDebug from "./oauth-debug"

interface LoginPageProps {
  onLogin: (userData: { name: string; email: string }) => void
}

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
  given_name: string
  family_name: string
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

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [dots, setDots] = useState<Dot[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id'
  const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback'

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

  useEffect(() => {
    // Check if we're returning from Google OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (error) {
      setError('Authentication failed. Please try again.')
      return
    }

    if (code) {
      handleGoogleCallback(code)
    }
  }, [])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Generate random state for security
      const state = Math.random().toString(36).substring(7)
      
      // Store state in localStorage for verification
      localStorage.setItem('google_oauth_state', state)

      // Construct Google OAuth URL
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID)
      googleAuthUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI)
      googleAuthUrl.searchParams.append('response_type', 'code')
      googleAuthUrl.searchParams.append('scope', 'openid email profile')
      googleAuthUrl.searchParams.append('state', state)
      googleAuthUrl.searchParams.append('access_type', 'offline')
      googleAuthUrl.searchParams.append('prompt', 'consent')

      // Redirect to Google OAuth
      window.location.href = googleAuthUrl.toString()
    } catch (error) {
      console.error('Google OAuth error:', error)
      setError('Failed to start Google authentication. Please try again.')
      setIsLoading(false)
    }
  }

  const handleGoogleCallback = async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Verify state parameter
      const urlParams = new URLSearchParams(window.location.search)
      const returnedState = urlParams.get('state')
      const storedState = localStorage.getItem('google_oauth_state')

      if (returnedState !== storedState) {
        throw new Error('Invalid state parameter')
      }

      // Exchange code for tokens and get user data
      const tokenResponse = await fetch('/api/auth/google/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirect_uri: GOOGLE_REDIRECT_URI }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens')
      }

      const { access_token, user } = await tokenResponse.json()

      // Clean up
      localStorage.removeItem('google_oauth_state')
      
      // Remove URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)

      // Call the login callback with user data
      onLogin({
        name: user.name,
        email: user.email,
      })

    } catch (error) {
      console.error('Google callback error:', error)
      setError('Authentication failed. Please try again.')
      setIsLoading(false)
      
      // Clean up on error
      localStorage.removeItem('google_oauth_state')
      window.history.replaceState({}, document.title, window.location.pathname)
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
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-300">Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">
                    {isLoading ? "Signing in..." : "Continue with Google"}
                  </span>
                </div>
              </Button>

              {/* <div className="text-center text-sm text-gray-400">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </div> */}

              {/* Debug Button */}
              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-400 hover:text-gray-300"
              >
                {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
            </CardContent>
          </Card>

          {/* Debug Component */}
          {showDebug && <OAuthDebug />}
        </div>
      </div>
    </div>
  )
}
