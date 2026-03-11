import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bpvrqphmxrnjrbjtaxuw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdnJxcGhteHJuanJianRheHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MzMwODksImV4cCI6MjA1NzIwOTA4OX0.sb_publishable_aoqlh2DuSCCN7ncdQ7o6GA_4MRdKnvRzFiA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
