/**
 * Seed Script: Erstellt 5 Test-Nutzer über die Supabase Auth API
 * und testet Posts + Chat-Nachrichten.
 *
 * Ausführen: node scripts/seed-test-users.mjs
 */

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SUPABASE_URL = 'https://bbnvrugxtznxcxjdtszk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibnZydWd4dHpueGN4amR0c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTA5MTYsImV4cCI6MjA5NzQ2NjkxNn0.FGRqcGgMB4cpqoDnqo3cFDTXGD4zcW-BjVoq4YVmmT8';

const SB_OPTIONS = { realtime: { transport: WebSocket } };

const TEST_USERS = [
  {
    email: 'max.mustermann@wuerth-test.de',
    password: 'WuerthTest2026!',
    first_name: 'Max',
    last_name: 'Mustermann',
    university: 'TU München',
    degree: 'Elektrotechnik',
    semester: '6',
    status: 'student',
    role: 'user',
  },
  {
    email: 'anna.schmidt@wuerth-test.de',
    password: 'WuerthTest2026!',
    first_name: 'Anna',
    last_name: 'Schmidt',
    university: 'KIT Karlsruhe',
    degree: 'Informatik',
    semester: '4',
    status: 'intern',
    role: 'user',
  },
  {
    email: 'lukas.weber@wuerth-test.de',
    password: 'WuerthTest2026!',
    first_name: 'Lukas',
    last_name: 'Weber',
    university: 'Hochschule Heilbronn',
    degree: 'Maschinenbau',
    semester: '3',
    status: 'student',
    role: 'user',
  },
  {
    email: 'sarah.mueller@wuerth-test.de',
    password: 'WuerthTest2026!',
    first_name: 'Sarah',
    last_name: 'Müller',
    university: 'Uni Stuttgart',
    degree: 'Wirtschaftsingenieurwesen',
    semester: '5',
    status: 'student',
    role: 'specialist',
  },
  {
    email: 'admin@wuerth-test.de',
    password: 'WuerthAdmin2026!',
    first_name: 'Admin',
    last_name: 'Würth',
    university: 'Würth Elektronik',
    degree: 'HR Management',
    semester: '1',
    status: 'employee',
    role: 'admin',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(icon, msg) {
  console.log(`${icon}  ${msg}`);
}

/**
 * Try to sign up OR login a user. Returns { userId, supabase } on success.
 */
async function ensureUser(user) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, SB_OPTIONS);

  // 1) Try login first – user might already exist
  {
    const { data, error } = await sb.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (!error && data?.user) {
      // Upsert profile in case it's missing
      await sb.from('profiles').upsert({
        id: data.user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        university: user.university,
        degree: user.degree,
        semester: user.semester,
        status: user.status,
        role: user.role,
      });
      return { userId: data.user.id, supabase: sb };
    }
  }

  // 2) Try sign-up
  {
    const { data, error } = await sb.auth.signUp({
      email: user.email,
      password: user.password,
    });

    if (error) {
      // Rate limit or other error
      throw new Error(error.message);
    }

    const userId = data?.user?.id;
    if (!userId) {
      throw new Error('Kein User-Objekt zurückgegeben (evtl. E-Mail-Bestätigung aktiv?)');
    }

    // Create profile
    await sb.from('profiles').upsert({
      id: userId,
      first_name: user.first_name,
      last_name: user.last_name,
      university: user.university,
      degree: user.degree,
      semester: user.semester,
      status: user.status,
      role: user.role,
    });

    // Try login after sign-up
    const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (loginError) {
      throw new Error(`Sign-up OK, aber Login fehlgeschlagen: ${loginError.message}`);
    }

    return { userId: loginData.user?.id || userId, supabase: sb };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Würth Network – Test-User Seed & Funktionstest   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── Phase 1: Create / Login users ──────────────────────────────────
  log('👥', 'PHASE 1 – Erstelle / logge 5 Test-Nutzer ein …\n');

  const createdUsers = []; // { ...user, userId, supabase }

  for (const user of TEST_USERS) {
    try {
      const result = await ensureUser(user);
      createdUsers.push({ ...user, ...result });
      log('✅', `${user.first_name} ${user.last_name} (${user.email}) – bereit`);
    } catch (err) {
      log('❌', `${user.email}: ${err.message}`);
    }
    await sleep(500);
  }

  console.log(`\n   → ${createdUsers.length} / ${TEST_USERS.length} User bereit.\n`);

  if (createdUsers.length === 0) {
    log('🛑', 'Keine User verfügbar – Abbruch.');
    log('💡', 'Tipp: Gehe in Supabase Dashboard → Authentication → Settings');
    log('   ', '→ "Confirm email" deaktivieren und Script erneut ausführen.');
    process.exit(1);
  }

  // ── Phase 2: Test Post erstellen ───────────────────────────────────
  log('📝', 'PHASE 2 – Teste Post-Erstellung …\n');

  const poster = createdUsers[0];
  const { data: postData, error: postError } = await poster.supabase
    .from('posts')
    .insert({
      author_id: poster.userId,
      title: '🧪 Automatischer Testpost',
      content:
        'Dieser Post wurde automatisch vom Seed-Script erstellt, um zu verifizieren, dass die Post-Funktion korrekt funktioniert.',
      type: 'news',
    })
    .select()
    .single();

  if (postError) {
    log('❌', `Post-Erstellung fehlgeschlagen: ${postError.message}`);
  } else {
    log('✅', `Post erstellt! ID: ${postData.id}`);
  }

  // Verify posts are readable
  const { data: readPosts, error: readError } = await poster.supabase
    .from('posts')
    .select('id, title, author_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (readError) {
    log('❌', `Posts lesen fehlgeschlagen: ${readError.message}`);
  } else {
    log('✅', `${readPosts.length} Post(s) im Feed gefunden:`);
    readPosts.forEach((p) => log('   ', `• "${p.title}" (${p.id})`));
  }

  // ── Phase 3: Chat / Channels testen ────────────────────────────────
  console.log('');
  log('💬', 'PHASE 3 – Teste Chat-Funktion (Channels + Messages) …\n');

  // 3a. Get or create channels
  let { data: channels, error: channelsError } = await poster.supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true });

  if (channelsError) {
    log('❌', `Channels laden fehlgeschlagen: ${channelsError.message}`);
    channels = [];
  }

  if (!channels || channels.length === 0) {
    log('⚠️ ', 'Keine Channels vorhanden – erstelle Demo-Channels …');
    const { error: chInsertErr } = await poster.supabase.from('channels').insert([
      { name: 'general', description: 'Allgemeine Diskussionen' },
      { name: 'internships-2026', description: 'Fragen und Austausch zu Praktika 2026' },
      { name: 'tech-talk', description: 'Diskussionen über Technologie und Trends' },
    ]);
    if (chInsertErr) {
      log('❌', `Channel-Erstellung fehlgeschlagen: ${chInsertErr.message}`);
    }
    const refetch = await poster.supabase.from('channels').select('*').order('created_at', { ascending: true });
    channels = refetch.data || [];
  }

  if (channels.length > 0) {
    log('✅', `${channels.length} Channel(s) gefunden:`);
    channels.forEach((c) => log('   ', `• #${c.name} – ${c.description || '(keine Beschreibung)'}`));
  }

  if (channels.length === 0) {
    log('🛑', 'Keine Channels verfügbar – Chat-Test nicht möglich.');
  } else {
    const generalChannel = channels.find((c) => c.name === 'general') || channels[0];
    console.log('');
    log('💬', `Sende Testnachrichten in #${generalChannel.name} …\n`);

    const testMessages = [
      { userIdx: 0, text: 'Hallo zusammen! 👋 Das ist mein erster Post im Würth Network.' },
      { userIdx: 1, text: 'Hey Max! Cool dass du hier bist. Wie läuft das Praktikum?' },
      { userIdx: 2, text: 'Hi alle! Bin neu hier – studiere Maschinenbau an der HS Heilbronn 🎓' },
      { userIdx: 3, text: 'Willkommen! Falls ihr Fragen zu den EMV-Produkten habt, meldet euch gerne bei mir.' },
      { userIdx: 4, text: 'Schöne Runde hier! Das Netzwerk wächst. 🚀' },
    ];

    let messagesSent = 0;
    for (const msg of testMessages) {
      const sender = createdUsers[msg.userIdx] || createdUsers[0];
      const { error: msgError } = await sender.supabase.from('messages').insert({
        channel_id: generalChannel.id,
        user_id: sender.userId,
        content: msg.text,
      });

      if (msgError) {
        log('❌', `Nachricht von ${sender.first_name} fehlgeschlagen: ${msgError.message}`);
      } else {
        log('✅', `${sender.first_name}: "${msg.text}"`);
        messagesSent++;
      }
      await sleep(300);
    }

    console.log('');
    log('📥', `Verifiziere Nachrichten in #${generalChannel.name} …\n`);

    const { data: messagesData, error: messagesError } = await poster.supabase
      .from('messages')
      .select(`
        id, content, created_at,
        profiles (first_name, last_name)
      `)
      .eq('channel_id', generalChannel.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      log('❌', `Nachrichten laden fehlgeschlagen: ${messagesError.message}`);
    } else {
      log('✅', `${messagesData.length} Nachricht(en) in #${generalChannel.name} gefunden:`);
      messagesData.reverse().forEach((m) => {
        const name = m.profiles
          ? `${m.profiles.first_name} ${m.profiles.last_name}`
          : 'Unknown';
        log('   ', `• [${name}] ${m.content}`);
      });
    }

    // ── Realtime quick-test ──────────────────────────────────────────
    console.log('');
    log('⚡', 'Teste Realtime-Subscription …\n');

    let realtimeReceived = false;

    const realtimeChannel = poster.supabase
      .channel(`test-realtime-${generalChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${generalChannel.id}`,
        },
        (payload) => {
          realtimeReceived = true;
          log('⚡', `Realtime empfangen: "${payload.new.content}"`);
        }
      )
      .subscribe();

    await sleep(2000);

    const realtimeSender = createdUsers[1] || createdUsers[0];
    const { error: rtError } = await realtimeSender.supabase.from('messages').insert({
      channel_id: generalChannel.id,
      user_id: realtimeSender.userId,
      content: '🔔 Realtime-Test: Diese Nachricht sollte live ankommen!',
    });

    if (rtError) {
      log('❌', `Realtime-Testnachricht fehlgeschlagen: ${rtError.message}`);
    } else {
      log('📤', 'Realtime-Testnachricht gesendet – warte 3 Sekunden …');
    }

    await sleep(3000);

    if (realtimeReceived) {
      log('✅', 'Realtime funktioniert! Nachrichten werden live empfangen. 🎉');
    } else {
      log('⚠️ ', 'Realtime-Nachricht nicht empfangen.');
      log('   ', '(Möglicherweise muss Realtime in Supabase Dashboard → Database → Replication aktiviert werden)');
    }

    await poster.supabase.removeChannel(realtimeChannel);
  }

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  TEST-ZUGANGSDATEN                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║                                                          ║');
  for (const u of TEST_USERS.slice(0, 4)) {
    const line = `║  📧 ${u.email}`.padEnd(61, ' ') + '║';
    const pw = `║     Passwort: ${u.password}`.padEnd(61, ' ') + '║';
    console.log(line);
    console.log(pw);
  }
  console.log('║                                                          ║');
  console.log('║  🔑 Admin-Zugang:                                        ║');
  const adminLine = `║  📧 ${TEST_USERS[4].email}`.padEnd(61, ' ') + '║';
  const adminPw = `║     Passwort: ${TEST_USERS[4].password}`.padEnd(61, ' ') + '║';
  console.log(adminLine);
  console.log(adminPw);
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Sign out all
  for (const u of createdUsers) {
    await u.supabase.auth.signOut();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Unbekannter Fehler:', err);
  process.exit(1);
});
