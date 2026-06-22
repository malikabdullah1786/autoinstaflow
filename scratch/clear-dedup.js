const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaaodujmgqrzjqbaibnl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYW9kdWptZ3FyempxYmFpYm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDE2ODcsImV4cCI6MjA5NzYxNzY4N30.KXABZP96BhZtOz3je_wZ9AyWgcGJFCbHZu83Fyr1dsI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearDeduplicationEvents() {
  console.log("Checking current entries in 'automation_events'...");
  
  // Fetch counts grouped by event_type
  const { data: events, error: countErr } = await supabase
    .from('automation_events')
    .select('event_type');
    
  if (countErr) {
    console.error("Error fetching events:", countErr.message);
    return;
  }

  console.log(`Total events found: ${events.length}`);
  const counts = events.reduce((acc, ev) => {
    acc[ev.event_type] = (acc[ev.event_type] || 0) + 1;
    return acc;
  }, {});
  console.log("Event counts by type:", counts);

  if (events.length === 0) {
    console.log("No events to delete.");
    return;
  }

  console.log("Deleting all entries from 'automation_events' table to reset duplicate check status...");
  
  // In Supabase, to delete all rows we can filter using neq('id', '00000000-0000-0000-0000-000000000000') or similar
  const { data, error: deleteErr, count } = await supabase
    .from('automation_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

  if (deleteErr) {
    console.error("Error deleting events:", deleteErr.message);
  } else {
    console.log("Successfully cleared the duplicate check logs from 'automation_events' table.");
  }
}

clearDeduplicationEvents();
