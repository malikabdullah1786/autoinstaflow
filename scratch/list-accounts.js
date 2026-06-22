const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaaodujmgqrzjqbaibnl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYW9kdWptZ3FyempxYmFpYm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDE2ODcsImV4cCI6MjA5NzYxNzY4N30.KXABZP96BhZtOz3je_wZ9AyWgcGJFCbHZu83Fyr1dsI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: accounts, error: dbError } = await supabase
    .from('instagram_accounts')
    .select('*');
    
  if (dbError) {
    console.error("Error listing accounts:", dbError);
    return;
  }
  
  console.log(`Found ${accounts.length} accounts:`);
  accounts.forEach((acc, idx) => {
    console.log(`${idx + 1}. Username: @${acc.username}, ID: ${acc.id}, IG User ID: ${acc.instagram_user_id}, Status: ${acc.token_status}, Token prefix: ${acc.access_token ? acc.access_token.substring(0, 20) + "..." : "none"}`);
  });
}

run();
