require('dotenv').config({ path: '.env.local' })

console.log('🔍 Checking environment variables...\n')

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
  'CLAUDE_API_KEY': 'Claude API key'
}

let allSet = true

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set (${description})`)
    // Show first few characters of the value
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value
    console.log(`   Preview: ${preview}`)
  } else {
    console.log(`❌ ${varName}: Missing (${description})`)
    allSet = false
  }
  console.log('')
}

if (allSet) {
  console.log('🎉 All environment variables are set!')
  console.log('💡 You can now run your Next.js app and test the RAG chatbot.')
} else {
  console.log('⚠️  Some environment variables are missing!')
  console.log('')
  console.log('To fix this:')
  console.log('1. Create a .env.local file in your project root')
  console.log('2. Add the missing variables:')
  console.log('')
  console.log('Example .env.local file:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  console.log('CLAUDE_API_KEY=your-claude-api-key')
  console.log('')
  console.log('💡 Get your keys from:')
  console.log('   - Supabase: https://supabase.com/dashboard')
  console.log('   - Claude: https://console.anthropic.com/')
}

process.exit(allSet ? 0 : 1) 