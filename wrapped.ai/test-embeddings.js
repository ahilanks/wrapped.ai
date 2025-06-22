require('dotenv').config({ path: '.env.local' })

// Test embeddings API
async function testEmbeddingsAPI() {
  try {
    console.log('Testing embeddings API with Claude...')

    // Test with a sample query
    const testData = {
      text: "AI and machine learning patterns"
    }

    const response = await fetch('http://localhost:3000/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      return false
    }

    const data = await response.json()
    
    console.log('✅ Successfully generated embedding with Claude!')
    console.log('📊 Embedding length:', data.embedding?.length || 0)
    console.log('🔍 Query:', testData.text)
    
    if (data.embedding && data.embedding.length > 0) {
      console.log('📈 Sample embedding values:', data.embedding.slice(0, 5))
      console.log('🎯 Expected length: 1536 (Claude embedding dimensions)')
    }

    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure your Next.js dev server is running on port 3000')
    console.log('💡 Make sure CLAUDE_API_KEY is set in your .env.local file')
    return false
  }
}

// Test similarity search API
async function testSimilaritySearch() {
  try {
    console.log('\nTesting similarity search API...')

    // First generate an embedding
    const embeddingResponse = await fetch('http://localhost:3000/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: "AI and machine learning" })
    })

    if (!embeddingResponse.ok) {
      console.error('❌ Failed to generate embedding for similarity search')
      return false
    }

    const embeddingData = await embeddingResponse.json()

    // Now test similarity search
    const searchData = {
      queryEmbedding: embeddingData.embedding,
      userId: "test@example.com",
      topK: 3
    }

    const searchResponse = await fetch('http://localhost:3000/api/similarity-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData)
    })

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ Similarity Search API Error:', searchResponse.status, errorText)
      return false
    }

    const searchResult = await searchResponse.json()
    
    console.log('✅ Successfully performed similarity search!')
    console.log('📊 Found documents:', searchResult.documents?.length || 0)
    
    if (searchResult.documents && searchResult.documents.length > 0) {
      console.log('📄 Top result:', {
        title: searchResult.documents[0].title,
        similarity: searchResult.documents[0].similarity?.toFixed(3)
      })
    }

    return true

  } catch (error) {
    console.error('❌ Similarity search test failed:', error.message)
    return false
  }
}

// Run the tests
async function runTests() {
  const embeddingTest = await testEmbeddingsAPI()
  const similarityTest = await testSimilaritySearch()
  
  if (embeddingTest && similarityTest) {
    console.log('\n🎉 All tests passed!')
    console.log('✅ Embedding generation with Claude: Working')
    console.log('✅ Similarity search with Supabase: Working')
  } else {
    console.log('\n💥 Some tests failed!')
  }
  
  process.exit((embeddingTest && similarityTest) ? 0 : 1)
}

runTests().catch(error => {
  console.error('💥 Test crashed:', error)
  process.exit(1)
}) 