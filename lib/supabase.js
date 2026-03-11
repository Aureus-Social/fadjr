import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bpvrqphmxrnjrbjtaxuw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdnJxcGhteHJuanJianRheHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTQ0MjMsImV4cCI6MjA4ODczMDQyM30.9WaS5gYPcB2d11S604xpu4hZmwtV55yDlxxgNUaZEwA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
