const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uaaodujmgqrzjqbaibnl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYW9kdWptZ3FyempxYmFpYm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDE2ODcsImV4cCI6MjA5NzYxNzY4N30.KXABZP96BhZtOz3je_wZ9AyWgcGJFCbHZu83Fyr1dsI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: account, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('username', 'tarzifyofficial')
      .single();
      
    if (dbError || !account) {
      console.log("No tarzifyofficial instagram account found in DB.", dbError);
      return;
    }
    
    console.log(`Testing for account: @${account.username} (User ID: ${account.instagram_user_id})`);
    
    // Test 1: Fetch with fields from route.ts (including media_product_type)
    const url1 = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,comments_count,like_count&limit=20&access_token=${account.access_token}`;
    console.log("\n--- TEST 1: Requesting media_product_type ---");
    console.log("URL:", url1.substring(0, 100) + "...");
    const res1 = await fetch(url1);
    const data1 = await res1.json();
    if (data1.error) {
      console.log("Test 1 FAILED with error:");
      console.log(data1.error);
    } else {
      console.log(`Test 1 SUCCEEDED! Retrieved ${data1.data ? data1.data.length : 0} items.`);
      if (data1.data && data1.data.length > 0) {
        console.log("First item properties:", Object.keys(data1.data[0]));
        console.log("First item data:", {
          id: data1.data[0].id,
          media_type: data1.data[0].media_type,
          media_product_type: data1.data[0].media_product_type,
          permalink: data1.data[0].permalink
        });
        
        console.log("\nAll items details:");
        data1.data.forEach((item, idx) => {
          console.log(`${idx + 1}. ID: ${item.id}, Type: ${item.media_type}, Product: ${item.media_product_type}, Permalink: ${item.permalink}`);
        });
      }
    }

    // Test 2: Fetch stories from /me/stories
    const url2 = `https://graph.instagram.com/me/stories?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${account.access_token}`;
    console.log("\n--- TEST 2: Requesting stories from /me/stories ---");
    console.log("URL:", url2.substring(0, 100) + "...");
    const res2 = await fetch(url2);
    const data2 = await res2.json();
    if (data2.error) {
      console.log("Test 2 FAILED with error:");
      console.log(data2.error);
    } else {
      console.log(`Test 2 SUCCEEDED! Retrieved ${data2.data ? data2.data.length : 0} items.`);
      if (data2.data && data2.data.length > 0) {
        data2.data.forEach((item, idx) => {
          console.log(`${idx + 1}. ID: ${item.id}, Type: ${item.media_type}, Permalink: ${item.permalink}`);
        });
      }
    }

    // Test 3: Fetch media from graph.facebook.com
    const url3 = `https://graph.facebook.com/v20.0/${account.instagram_user_id}/media?fields=id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,comments_count,like_count&limit=20&access_token=${account.access_token}`;
    console.log("\n--- TEST 3: Requesting media from graph.facebook.com ---");
    console.log("URL:", url3.substring(0, 100) + "...");
    const res3 = await fetch(url3);
    const data3 = await res3.json();
    if (data3.error) {
      console.log("Test 3 FAILED with error:");
      console.log(data3.error);
    } else {
      console.log(`Test 3 SUCCEEDED! Retrieved ${data3.data ? data3.data.length : 0} items.`);
      if (data3.data && data3.data.length > 0) {
        data3.data.forEach((item, idx) => {
          console.log(`${idx + 1}. ID: ${item.id}, Type: ${item.media_type}, Product: ${item.media_product_type}, Permalink: ${item.permalink}`);
        });
      }
    }
    
  } catch (e) {
    console.error("Test failed with exception:", e);
  }
}

run();
