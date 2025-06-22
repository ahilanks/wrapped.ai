import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ChatLog {
  id: string
  conversation_id: string
  title: string | null
  author_role: string | null
  email: string
  body: string
  created_at: string
  company: string | null
  attachments: any
  embeddings_json?: number[]
  wrapped_json: any
  graph_json: any
  similarity?: number
}

export async function POST(request: NextRequest) {
  try {
    const { queryEmbedding, userEmai, topK = 3 } = await request.json()
    const userEmail = "hello.devpatel@gmail.com"
    if (!queryEmbedding) {
      return NextResponse.json({ error: 'Query embedding is required' }, { status: 400 })
    }
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    console.log(`Searching chat logs for user: ${userEmail}`)
    console.log(`Query embedding length: ${queryEmbedding.length}`)

    // Fetch all chat logs for the user
    const { data: chatLogs, error: fetchError } = await supabase
      .from('chat_logs_final')
      .select('id, conversation_id, title, author_role, email, body, created_at, company, attachments, embeddings_json, wrapped_json, graph_json')
      .eq('email', userEmail)
      .limit(1000);

    if (fetchError) {
      console.error('Error fetching chat logs:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch chat logs' }, 
        { status: 500 }
      )
    }

    if (!chatLogs || chatLogs.length === 0) {
      console.log(`No chat logs found for user: ${userEmail}`)
      return NextResponse.json({ documents: [] })
    }

    console.log(`Found ${chatLogs.length} chat logs for similarity search`)

    // Ensure queryEmbedding is always length 512
    let queryEmbedding512 = queryEmbedding;
    if (queryEmbedding.length > 512) {
      queryEmbedding512 = queryEmbedding.slice(0, 512);
    } else if (queryEmbedding.length < 512) {
      queryEmbedding512 = queryEmbedding.concat(Array(512 - queryEmbedding.length).fill(0));
    }

    // Calculate cosine similarity for each chat log
    const logsWithSimilarity: ChatLog[] = chatLogs.map((log: ChatLog) => {
      let embeddings: number[][] = [];
      let raw = log.embeddings_json;

      // Parse if it's a string
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          console.warn(`Could not parse embeddings_json for log ${log.id}`);
          raw = [];
        }
      }

      // If it's an object with a key (e.g., 'conversation'), extract the array
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        // Use the first property value as the embedding
        const firstKey = Object.keys(raw)[0];
        if (firstKey && Array.isArray(raw[firstKey])) {
          embeddings = [raw[firstKey] as number[]];
        }
      } else if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        embeddings = raw as unknown as number[][];
      } else if (Array.isArray(raw) && typeof raw[0] === 'number') {
        embeddings = [raw as number[]];
      }

      // Debug log for first embedding
      // if (embeddings.length > 0) {
      //   console.log(`Log ${log.id} first embedding length: ${embeddings[0].length}, first 5 values:`, embeddings[0].slice(0, 5));
      // }

      let similarity = 0;
      if (embeddings.length > 0) {
        const scores = embeddings.map(embedding => {
          let localEmbedding = queryEmbedding512;
          if (localEmbedding.length > embedding.length) {
            localEmbedding = localEmbedding.slice(0, embedding.length);
          } else if (localEmbedding.length < embedding.length) {
            localEmbedding = localEmbedding.concat(Array(embedding.length - localEmbedding.length).fill(0));
          }
          return embedding.length === localEmbedding.length
            ? cosineSimilarity(localEmbedding, embedding)
            : 0;
        });
        similarity = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      if (embeddings.length === 0) {
        console.warn(`No valid embeddings for log ${log.id}`);
      }

      return {
        ...log,
        similarity
      };
    })

    // Sort by similarity (highest first) and take top K
    const topLogs = logsWithSimilarity
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, topK)

    // Get the body of the highest similarity log (first in sorted array)
    const bestBody = topLogs.length > 0 && topLogs[0].body
      ? topLogs[0].body
      : ''

    console.log(`Top ${topLogs.length} most similar logs:`, 
      topLogs.map(log => ({ 
        id: log.id, 
        title: log.title, 
        similarity: log.similarity?.toFixed(4),
        bodyPreview: log.body
      }))
    )

    return NextResponse.json({ 
      documents: topLogs,
      bestBody
    })

  } catch (error) {
    console.error('Error in similarity search:', error)
    return NextResponse.json(
      { error: 'Failed to perform similarity search' }, 
      { status: 500 }
    )
  }
}

// Cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    console.error(`Vector length mismatch: ${vecA.length} vs ${vecB.length}`)
    return 0
  }
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    console.error('Zero magnitude vector detected')
    return 0
  }
  
  const similarity = dotProduct / (magnitudeA * magnitudeB)
  return similarity
} 