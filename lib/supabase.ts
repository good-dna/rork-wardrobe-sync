import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mpqgxxxagueuqehiazyl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcWd4eHhhZ3VldXFlaGlhenlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTAzMjYsImV4cCI6MjA3MjIyNjMyNn0.8AbuWjGXYTBg9-hMirXUSrfk5iksEO36e2DSjszITOk'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase.from('_test').select('*').limit(1)
    
    if (error) {
      console.log('Supabase connection test result:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('Supabase connection successful')
    return { success: true, data }
  } catch (err) {
    console.error('Supabase connection failed:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}