import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://tygkufldabsuntomirku.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Z2t1ZmxkYWJzdW50b21pcmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzU3MjUsImV4cCI6MjA3NTE1MTcyNX0.uyHkWLDNp7D5L5B0yDVuhHiddlRe6-vH9Wsec-KHMQE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
