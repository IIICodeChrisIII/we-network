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
  for (let acc of accounts) {
    const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.password })
    });
    const loginData = await loginRes.json();
    const user = loginData.user;
    const access_token = loginData.access_token;

    if (user && access_token) {
      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: user.id,
          first_name: acc.first_name,
          last_name: acc.last_name,
          status: acc.status,
          role: acc.role
        })
      });
      if (upsertRes.ok) {
         console.log(`[UPSERTED] Profile for ${acc.email}`);
      } else {
         console.log(`[WARNING] Failed to upsert profile for ${acc.email}:`, await upsertRes.text());
      }
    }
  }
}
run();
