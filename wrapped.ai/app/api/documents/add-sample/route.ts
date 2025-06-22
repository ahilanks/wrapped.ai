import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sample documents for testing
const sampleDocuments = [
  {
    title: "AI & Machine Learning Patterns",
    content: "The user shows strong interest in AI and machine learning topics, with 52% of their interactions focused on these areas. They frequently ask about neural networks, deep learning algorithms, and practical applications of AI in real-world scenarios. Their most common queries involve Python programming for ML, TensorFlow implementations, and data preprocessing techniques.",
    metadata: { category: "AI/ML", percentage: 52 }
  },
  {
    title: "Programming & Code Analysis",
    content: "Programming and code-related queries make up 38% of interactions. The user often seeks help with Python programming, debugging, code optimization, and best practices for software development. They frequently ask about web development frameworks, API integrations, and database design patterns. Their coding style shows preference for clean, readable code with comprehensive error handling.",
    metadata: { category: "Programming", percentage: 38 }
  },
  {
    title: "Creative Writing & Content",
    content: "Creative writing represents 29% of the user's AI interactions. They frequently request help with storytelling, content creation, creative prompts, and writing techniques across various genres. They often ask for help with blog posts, marketing copy, and creative brainstorming sessions. Their writing style tends toward engaging, conversational content with strong narrative structure.",
    metadata: { category: "Creative", percentage: 29 }
  },
  {
    title: "Problem Solving Strategies",
    content: "Problem-solving queries account for 24% of interactions. The user often presents complex problems and seeks systematic approaches, analytical thinking methods, and step-by-step solutions. They prefer structured problem-solving frameworks and often ask for multiple solution approaches to compare. Their problem-solving style shows strong analytical thinking and attention to detail.",
    metadata: { category: "Problem Solving", percentage: 24 }
  },
  {
    title: "Learning & Education Patterns",
    content: "Learning and education topics represent 18% of interactions. The user frequently asks for explanations of complex concepts, study strategies, and educational resources across various subjects. They often request step-by-step tutorials, concept breakdowns, and practical examples. Their learning style shows preference for hands-on, practical approaches with real-world applications.",
    metadata: { category: "Education", percentage: 18 }
  },
  {
    title: "ChatGPT Usage Statistics",
    content: "The user has sent 4,231 messages this year, with an average of 11.6 messages per day. Their current streak is 18 days, with a longest streak of 31 days. They are most active in the evening (7-10 PM) with 42% of their activity. Peak usage occurs on weekdays, particularly Tuesday and Thursday. They typically engage in longer conversations with an average of 8.3 messages per session.",
    metadata: { category: "Statistics", total_messages: 4231, daily_average: 11.6 }
  },
  {
    title: "Prompt Style Analysis",
    content: "The user's prompt style is primarily code requests (45%), followed by questions (32%), analysis requests (15%), brainstorming (6%), and creative prompts (2%). They tend to be direct and specific in their requests, often providing context and constraints. Their prompts show strong technical background and preference for practical, actionable responses.",
    metadata: { category: "Analysis", code_requests: 45, questions: 32 }
  },
  {
    title: "Time-based Activity Patterns",
    content: "Evening hours (7-10 PM) account for 42% of activity, followed by afternoon (2-5 PM) at 28%, morning (9-12 AM) at 18%, late night (10-12 PM) at 8%, and early morning (6-9 AM) at 4%. Weekend usage is 35% lower than weekdays. They show consistent daily patterns with slight variations on weekends.",
    metadata: { category: "Patterns", evening_activity: 42, weekend_usage: -35 }
  }
]

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Check if Voyage AI API key is available
    const voyageApiKey = process.env.VOYAGE_API_KEY
    if (!voyageApiKey) {
      return NextResponse.json(
        { error: 'Voyage AI API key not configured' }, 
        { status: 500 }
      )
    }

    console.log(`Adding sample documents for user: ${userEmail}`)

    const addedDocuments = []

    for (const doc of sampleDocuments) {
      try {
        // Generate embedding for the document content
        const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${voyageApiKey}`
          },
          body: JSON.stringify({
            model: 'voyage-3-lite',
            input: doc.content
          })
        })

        if (!embeddingResponse.ok) {
          console.error(`Failed to generate embedding for: ${doc.title}`)
          continue
        }

        const embeddingData = await embeddingResponse.json()
        const embedding = embeddingData.data[0].embedding

        // Insert document into database
        const { data, error } = await supabase
          .from('documents')
          .insert({
            user_email: userEmail,
            title: doc.title,
            content: doc.content,
            embedding: embedding,
            metadata: doc.metadata
          })
          .select()

        if (error) {
          console.error(`Error inserting document ${doc.title}:`, error)
          continue
        }

        addedDocuments.push({
          title: doc.title,
          id: data[0].id
        })

        console.log(`Added document: ${doc.title}`)

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error processing document ${doc.title}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true,
      addedDocuments,
      totalAdded: addedDocuments.length
    })

  } catch (error) {
    console.error('Error adding sample documents:', error)
    return NextResponse.json(
      { error: 'Failed to add sample documents' }, 
      { status: 500 }
    )
  }
} 