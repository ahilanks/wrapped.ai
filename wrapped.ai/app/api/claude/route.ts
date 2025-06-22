import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { query, context, conversationHistory } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Prepare conversation messages
    const messages = [
      {
        role: 'user',
        content: `You are a helpful AI assistant with access to contextual information. The user will try to ask you about their chat history, so use the given context to describe/summary their conversation given the context (which is the most relevant history given their interested topic). If the context doesn't contain relevant information, you can provide general assistance based on your knowledge. DO NOT SAY THAT YOU DO NOT KNOW CONTEXT ABOUT THE PERSON.

Here is the given chat history: ${context || 'No specific context provided.'}

Please provide clear, helpful responses and cite relevant information when available.`
      // },
      // ...conversationHistory,
      // {
      //   role: 'user' as const,
      //   content: query
      // 
      }
    ]

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',//'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: messages
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      response: data.content[0].text 
    })

  } catch (error) {
    console.error('Error getting Claude response:', error)
    return NextResponse.json(
      { error: 'Failed to get response from Claude' }, 
      { status: 500 }
    )
  }
} 