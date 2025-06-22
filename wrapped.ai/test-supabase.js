require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing required environment variables!')
      console.log('Please create a .env.local file with:')
      console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
      console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('\nTesting Supabase connection...')

    // Test basic table access
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Error accessing documents table:', error)
      return false
    }

    console.log('✅ Successfully connected to Supabase!')
    console.log(`📊 Found ${documents?.length || 0} documents in the table`)
    
    if (documents && documents.length > 0) {
      console.log('📄 Sample document:', {
        id: documents[0].id,
        title: documents[0].title,
        content: documents[0].content.substring(0, 100) + '...',
        embedding_length: documents[0].embedding?.length || 0
      })
    }

    return true

  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 All tests passed!')
    } else {
      console.log('\n💥 Tests failed!')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test crashed:', error)
    process.exit(1)
  }) 