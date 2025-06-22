import { supabase } from './supabase'

export interface GoogleUserInfo {
  email: string
  name: string
  picture: string
  id: string
}

export async function saveUserToDatabase(userInfo: GoogleUserInfo) {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        google_id: userInfo.id,
        avatar_url: userInfo.picture,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save user to database')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error saving user to database:', error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  try {
    const response = await fetch(`/api/auth/user?email=${encodeURIComponent(email)}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    const result = await response.json()
    return result.user
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
} 