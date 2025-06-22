import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Check if Voyage AI API key is available
    const voyageApiKey = process.env.VOYAGE_API_KEY
    if (!voyageApiKey) {
      console.error('VOYAGE_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Voyage AI API key not configured' }, 
        { status: 500 }
      )
    }

    console.log('Generating embedding for text:', text.substring(0, 50) + '...')

    // Call Voyage AI's embedding API
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voyageApiKey}`
      },
      body: JSON.stringify({
        model: 'voyage-3-lite',
        input: text
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Voyage AI API error:', response.status, errorText)
      throw new Error(`Voyage AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      console.error('Invalid response from Voyage AI API:', data)
      throw new Error('Invalid response format from Voyage AI API')
    }

    console.log('Successfully generated embedding with length:', data.data[0].embedding.length)
    
    return NextResponse.json({ 
      embedding: data.data[0].embedding 
    })

  } catch (error) {
    console.error('Error generating embedding:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate embedding', details: errorMessage }, 
      { status: 500 }
    )
  }
} 