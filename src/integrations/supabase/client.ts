import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bpnzmdyheajrosupqrve.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwbnptZHloZWFqcm9zdXBxcnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTk3OTcsImV4cCI6MjA3Nzk5NTc5N30.lB6U1Fn-_xiTyycPPgeSQul4_ZMQvA4GZoiZMfXX3Mc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
