const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaaodujmgqrzjqbaibnl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYW9kdWptZ3FyempxYmFpYm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDE2ODcsImV4cCI6MjA5NzYxNzY4N30.KXABZP96BhZtOz3je_wZ9AyWgcGJFCbHZu83Fyr1dsI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Fetching specific automation...");
  const { data: aut, error: errA } = await supabase
    .from('automations')
    .select('*')
    .eq('id', 'bc3010a5-af0c-4f78-b548-c2c9f168b8fa')
    .maybeSingle();
  console.log("Automation bc3010a5-af0c-4f78-b548-c2c9f168b8fa:");
  console.log(JSON.stringify(aut, null, 2));
}

check();
