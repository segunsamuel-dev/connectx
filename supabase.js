// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'Https://ugdjenbgdkjizrfpgdzd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZGplbmJnZGtqaXpyZnBnZHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDI1MzksImV4cCI6MjA5MTQ3ODUzOX0.s2JFWm_Le8U5ugq2yLU46RQeuTP5ldv9W-oMWCxaRWo'

export const supabase = createClient(supabaseUrl, supabaseKey)