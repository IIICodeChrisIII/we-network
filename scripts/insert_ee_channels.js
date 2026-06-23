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

const newChannels = [
  { name: 'elektrotechnik-allgemein', description: 'Allgemeiner Austausch zur Elektrotechnik' },
  { name: 'hardware-design', description: 'Platinen, Schaltungen, PCB Design' },
  { name: 'embedded-systems', description: 'Mikrocontroller, FPGAs, Firmware' },
  { name: 'energietechnik', description: 'Hochspannung, Erneuerbare Energien, Leistungselektronik' },
  { name: 'automatisierung', description: 'SPS, Regelungstechnik, Robotik' }
];

async function run() {
  // Login as admin
  const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const access_token = loginData.access_token;

  if (!access_token) {
    console.error("Failed to login as admin");
    return;
  }

  // Insert channels
  for (const ch of newChannels) {
    const res = await fetch(`${supabaseUrl}/rest/v1/channels`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify(ch)
    });
    if (res.ok) {
      console.log(`Inserted channel: ${ch.name}`);
    } else {
      console.error(`Failed to insert ${ch.name}:`, await res.text());
    }
  }
}
run();
