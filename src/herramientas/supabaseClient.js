// js/supabaseClient.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'

const SUPABASE_URL = 'https://ypgfwzuctctjsjvcqpei.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ2Z3enVjdGN0anNqdmNxcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MTQ3MTIsImV4cCI6MjA2MTM5MDcxMn0.t5WYlQ8Ip49mZKZphEYnuhI5LudxsTCf4nYvBZHNgt8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});


