import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Get the Supabase key - supports both anon key and publishable key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

// Client-side Supabase client for realtime and public read operations
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Server-side Supabase client with service role for admin operations
// Falls back to the same key if service role key is not available
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
