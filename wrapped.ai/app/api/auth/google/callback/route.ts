import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  // Handle missing authorization code
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    // Verify state parameter (basic check - in production, verify against stored state)
    if (!state) {
      console.warn('No state parameter received')
    }

    // Redirect back to the main app with the authorization code
    // The client-side code will handle the token exchange
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('code', code)
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url))
  }
} 