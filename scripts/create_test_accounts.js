import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = fs.readFileSync(resolve(__dirname, '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) envVars[match[1]] = match[2];
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const accounts = [
  { email: 'student@test.com', password: 'password123', first_name: 'Max', last_name: 'Student', status: 'student', role: 'user' },
  { email: 'employee@test.com', password: 'password123', first_name: 'Anna', last_name: 'Mitarbeiter', status: 'employee', role: 'user' },
  { email: 'admin@test.com', password: 'password123', first_name: 'Super', last_name: 'Admin', status: 'employee', role: 'admin' },
  { email: 'analytics@test.com', password: 'password123', first_name: 'Data', last_name: 'Analyst', status: 'employee', role: 'analytics' },
  { email: 'intern@test.com', password: 'password123', first_name: 'Lisa', last_name: 'Prakti', status: 'intern', role: 'user' },
];

async function run() {
  console.log("Creating test accounts...");
  for (let acc of accounts) {
    const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.password })
    });
    
    let user = null;
    let access_token = null;

    if (!signupRes.ok) {
      const err = await signupRes.json();
      if (err.msg && err.msg.includes('registered')) {
        console.log(`[SKIP] ${acc.email} is already registered. Logging in to update profile...`);
        const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: acc.email, password: acc.password })
        });
        const loginData = await loginRes.json();
        user = loginData.user;
        access_token = loginData.access_token;
      } else {
        console.log(`[ERROR] creating ${acc.email}:`, err);
        continue;
      }
    } else {
      const data = await signupRes.json();
      user = data.user;
      access_token = data.access_token;
      console.log(`[CREATED] ${acc.email}`);
      await new Promise(r => setTimeout(r, 1000));
    }

    if (user && access_token) {
      const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          first_name: acc.first_name,
          last_name: acc.last_name,
          status: acc.status,
          role: acc.role
        })
      });
      if (updateRes.ok) {
         console.log(`[UPDATED] Profile for ${acc.email}`);
      } else {
         console.log(`[WARNING] Failed to update profile:`, await updateRes.text());
      }
    }
  }
  console.log("Done!");
}

run();
