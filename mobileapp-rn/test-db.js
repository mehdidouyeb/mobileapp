// Test script to verify Supabase connection and user_profiles table
// Run with: node test-db.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing Supabase connection...');

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    console.log('📊 Connection test:', { connectionTest, connectionError });

    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message);
      return;
    }

    console.log('✅ Database connection successful!');

    // Test user creation/update
    const testUserId = 'test-user-id';
    const { data: upsertResult, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: testUserId,
        email: 'test@example.com',
        preferred_language: 'es',
        target_language: 'fr',
        updated_at: new Date().toISOString(),
      });

    console.log('📝 Upsert test:', { upsertResult, upsertError });

    if (upsertError) {
      console.log('❌ Upsert failed:', upsertError.message);
    } else {
      console.log('✅ Upsert successful!');
    }

  } catch (error) {
    console.log('💥 Unexpected error:', error);
  }
}

testDatabase();
