"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [apiCheck, setApiCheck] = useState<any>(null)

  const checkConfiguration = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/auth/google/callback`
      : 'http://localhost:3000/api/auth/google/callback'

    const info = {
      clientId: clientId || 'NOT SET',
      clientIdLength: clientId?.length || 0,
      redirectUri,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      isLocalhost: typeof window !== 'undefined' ? window.location.hostname === 'localhost' : false,
      timestamp: new Date().toISOString()
    }

    setDebugInfo(info)
    console.log('OAuth Debug Info:', info)
  }

  const checkApiRoutes = async () => {
    const routes = [
      '/api/auth/google/callback',
      '/api/auth/google/token'
    ]

    const results: Record<string, any> = {}

    for (const route of routes) {
      try {
        const response = await fetch(route, { method: 'GET' })
        results[route] = {
          exists: true,
          status: response.status,
          statusText: response.statusText
        }
      } catch (error) {
        results[route] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    setApiCheck(results)
    console.log('API Routes Check:', results)
  }

  const testOAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId || clientId === 'your_actual_google_client_id_here') {
      alert('Please set your actual Google Client ID in .env.local')
      return
    }

    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const state = Math.random().toString(36).substring(7)
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.append('client_id', clientId)
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.append('response_type', 'code')
    googleAuthUrl.searchParams.append('scope', 'openid email profile')
    googleAuthUrl.searchParams.append('state', state)
    googleAuthUrl.searchParams.append('access_type', 'offline')
    googleAuthUrl.searchParams.append('prompt', 'consent')

    console.log('Generated OAuth URL:', googleAuthUrl.toString())
    alert(`OAuth URL generated. Check console for details.\n\nClient ID: ${clientId}\nRedirect URI: ${redirectUri}`)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Google OAuth Debug Tool</CardTitle>
        <CardDescription>
          Use this tool to debug your Google OAuth configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={checkConfiguration} variant="outline">
            Check Configuration
          </Button>
          <Button onClick={checkApiRoutes} variant="outline">
            Check API Routes
          </Button>
          <Button onClick={testOAuthUrl} variant="outline">
            Test OAuth URL
          </Button>
        </div>

        {debugInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {apiCheck && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">API Routes Status:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(apiCheck, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">✅ Required API Routes:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <code>/api/auth/google/callback</code> - Handles OAuth redirect</li>
            <li>• <code>/api/auth/google/token</code> - Exchanges code for tokens</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Common Issues:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Client ID not set in .env.local</li>
            <li>• Client ID format incorrect (should end with .apps.googleusercontent.com)</li>
            <li>• Redirect URI mismatch in Google Cloud Console</li>
            <li>• OAuth consent screen not configured</li>
            <li>• API not enabled in Google Cloud Console</li>
            <li>• Missing API routes (now fixed!)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Quick Fixes:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Go to Google Cloud Console → APIs & Services → Credentials</li>
            <li>2. Find your OAuth 2.0 Client ID</li>
            <li>3. Copy the Client ID and Client Secret</li>
            <li>4. Update your .env.local file</li>
            <li>5. Ensure redirect URI matches: {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : 'http://localhost:3000/api/auth/google/callback'}</li>
            <li>6. ✅ API routes are now available!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
} 