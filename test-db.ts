import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.example' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const { data, error } = await supabase.from('food_logs').select('meal_time').limit(1);
  console.log('DATA:', JSON.stringify(data, null, 2));
  console.log('ERROR:', error);
}

test();
