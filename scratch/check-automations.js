const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaaodujmgqrzjqbaibnl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYW9kdWptZ3FyempxYmFpYm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDE2ODcsImV4cCI6MjA5NzYxNzY4N30.KXABZP96BhZtOz3je_wZ9AyWgcGJFCbHZu83Fyr1dsI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Fetching all automations...");
  const { data: auts, error: errA } = await supabase
    .from('automations')
    .select('*');
  if (errA) {
    console.error("Error fetching automations:", errA);
  } else {
    console.log("Automations:");
    console.log(JSON.stringify(auts, null, 2));
  }
}

check();
