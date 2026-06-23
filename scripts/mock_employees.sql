-- Fügt 3 realistische Würth-Mitarbeiter als Mocks in die Datenbank ein.
-- Sie können ganz normal im Chat über "Nachrichten" angeschrieben werden.

DO $$
DECLARE
  uid1 uuid := gen_random_uuid();
  uid2 uuid := gen_random_uuid();
  uid3 uuid := gen_random_uuid();
BEGIN
  -- 1. Insert into auth.users (Erforderlich für den Login und Foreign Keys in Supabase)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
  (uid1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'thomas.mueller@we-online.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  (uid2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.weber@we-online.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  (uid3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'markus.bauer@we-online.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

  -- 2. Insert into public.profiles (Hier werden Name, Bild und Bio für das Frontend festgelegt)
  INSERT INTO public.profiles (id, first_name, last_name, status, role, university, degree, semester, bio, avatar_url)
  VALUES
  (uid1, 'Thomas', 'Müller', 'employee', 'specialist', 'Würth Elektronik', 'Senior Hardware Engineer', '', 'Experte für PCB-Design und EMV. Helfe gerne bei Hardware-Fragen zu Schaltreglern.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  (uid2, 'Sarah', 'Weber', 'employee', 'specialist', 'Würth Elektronik', 'Embedded Software Lead', '', 'Fokus auf STM32, RTOS und sichere IoT-Geräte. Mentorin für Werkstudenten.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  (uid3, 'Markus', 'Bauer', 'employee', 'specialist', 'Würth Elektronik', 'Field Application Engineer', '', 'Dein Ansprechpartner für passive Bauelemente und Power Modules.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');

END $$;
