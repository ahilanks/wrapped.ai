// Simple test for embeddings API (Voyage AI)
async function testEmbeddingsAPI() {
  try {
    console.log('Testing Voyage AI embeddings API...')

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
    
    console.log('✅ Successfully generated embedding with Voyage AI!')
    console.log('📊 Embedding length:', data.embedding?.length || 0)
    console.log('🚢 Model: voyage-3-lite')
    
    if (data.embedding && data.embedding.length > 0) {
      console.log('📈 Sample embedding values:', data.embedding.slice(0, 5))
    }

    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure your Next.js dev server is running on port 3000')
    console.log('💡 Make sure VOYAGE_API_KEY is set in your .env.local file')
    return false
  }
}

// Run the test
testEmbeddingsAPI()
  .then(success => {
    if (success) {
      console.log('\n🎉 Test passed!')
    } else {
      console.log('\n💥 Test failed!')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test crashed:', error)
    process.exit(1)
  }) 