const fs = require('fs')
const path = require('path')

console.log('🔍 Checking environment variables...\n')

// Try to read .env.local file
let envContent = ''
try {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
    console.log('✅ .env.local file found')
  } else {
    console.log('❌ .env.local file not found')
  }
} catch (error) {
  console.log('❌ Error reading .env.local file:', error.message)
}

console.log('')

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
  'VOYAGE_API_KEY': 'Voyage AI API key'
}

let allSet = true

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set (${description})`)
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value
    console.log(`   Preview: ${preview}`)
  } else {
    console.log(`❌ ${varName}: Missing (${description})`)
    
    // Check if it's in the .env.local file
    const envMatch = envContent.match(new RegExp(`^${varName}=(.+)$`, 'm'))
    if (envMatch) {
      console.log(`   💡 Found in .env.local file`)
    } else {
      console.log(`   💡 Not found in .env.local file`)
    }
    
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
  console.log('VOYAGE_API_KEY=your-voyage-ai-api-key')
  console.log('')
  console.log('💡 Get your keys from:')
  console.log('   - Supabase: https://supabase.com/dashboard')
  console.log('   - Voyage AI: https://console.voyageai.com/')
  console.log('')
  console.log('⚠️  After creating .env.local, restart your Next.js dev server!')
}

process.exit(allSet ? 0 : 1) 