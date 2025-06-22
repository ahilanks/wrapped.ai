import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/connect?error=no_code', request.url))
  }

  try {
    // In a real implementation, you would exchange the code for an access token
    // For now, we'll simulate a successful connection
    console.log('Spotify OAuth callback received:', { code, state })
    
    // Redirect back to connect page with success
    return NextResponse.redirect(new URL('/connect?success=spotify', request.url))
  } catch (error) {
    console.error('Spotify OAuth error:', error)
    return NextResponse.redirect(new URL('/connect?error=spotify_auth_failed', request.url))
  }
} 