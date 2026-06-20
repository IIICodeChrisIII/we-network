-- 1. Lösche alle bisherigen (Test-)Nachrichten
DELETE FROM public.messages;

-- 2. Mock-Daten generieren (nutzt dynamisch vorhandene User und Channels)
DO $$
DECLARE
  user_a uuid;
  user_b uuid;
  user_c uuid;
  ch_allgemein uuid;
  ch_hardware uuid;
  ch_embedded uuid;
BEGIN
  -- Hole 3 existierende User aus der Datenbank (falls vorhanden)
  SELECT id INTO user_a FROM public.profiles LIMIT 1;
  SELECT id INTO user_b FROM public.profiles WHERE id != user_a LIMIT 1;
  SELECT id INTO user_c FROM public.profiles WHERE id != user_a AND id != user_b LIMIT 1;
  
  -- Falls es nur einen oder zwei User gibt, fallback
  IF user_b IS NULL THEN user_b := user_a; END IF;
  IF user_c IS NULL THEN user_c := user_a; END IF;

  -- Hole die Channel-IDs
  SELECT id INTO ch_allgemein FROM public.channels WHERE name = 'elektrotechnik-allgemein' LIMIT 1;
  SELECT id INTO ch_hardware FROM public.channels WHERE name = 'hardware-design' LIMIT 1;
  SELECT id INTO ch_embedded FROM public.channels WHERE name = 'embedded-systems' LIMIT 1;
  
  -- Füge sinnvolle Elektrotechnik-Mock-Konversationen in "elektrotechnik-allgemein" ein
  IF ch_allgemein IS NOT NULL AND user_a IS NOT NULL THEN
    INSERT INTO public.messages (channel_id, user_id, content, created_at) VALUES
    (ch_allgemein, user_a, 'Hallo zusammen! Ist hier noch jemand beim Hackathon dabei?', now() - interval '2 days'),
    (ch_allgemein, user_b, 'Hi! Ja, wir arbeiten gerade am Backend. Wie weit seid ihr?', now() - interval '1 day'),
    (ch_allgemein, user_a, 'Wir sind fast fertig mit dem Frontend. Tolle Stimmung hier im Netzwerk!', now() - interval '5 hours');
  END IF;

  -- Konversation in "hardware-design"
  IF ch_hardware IS NOT NULL AND user_a IS NOT NULL THEN
    INSERT INTO public.messages (channel_id, user_id, content, created_at) VALUES
    (ch_hardware, user_b, 'Hat jemand gute Tipps für den Einstieg ins PCB-Design?', now() - interval '3 days'),
    (ch_hardware, user_c, 'Ich kann dir KiCad empfehlen, das ist Open Source und wird auch bei uns im Team oft genutzt.', now() - interval '2 days'),
    (ch_hardware, user_b, 'Super, danke! Gibt es da spezielle Libraries, die Würth empfiehlt?', now() - interval '1 day'),
    (ch_hardware, user_a, 'Ja, schau mal auf der Würth Elektronik Website, wir haben fertige Bauteil-Bibliotheken (RedExpert) für KiCad und Altium!', now() - interval '1 hour');
  END IF;

  -- Konversation in "embedded-systems"
  IF ch_embedded IS NOT NULL AND user_a IS NOT NULL THEN
    INSERT INTO public.messages (channel_id, user_id, content, created_at) VALUES
    (ch_embedded, user_c, 'Arbeitet hier jemand zufällig mit dem STM32F4?', now() - interval '4 hours'),
    (ch_embedded, user_a, 'Ja, wir setzen den in einem unserer IoT-Projekte ein. Was ist die Frage?', now() - interval '3 hours'),
    (ch_embedded, user_c, 'Ich habe Probleme mit dem I2C Treiber (HAL). Der stürzt immer ab.', now() - interval '1 hour'),
    (ch_embedded, user_b, 'Bekannter Bug! Nutze am besten direkte Register-Zugriffe für I2C oder warte auf das nächste CubeMX Update.', now() - interval '10 minutes');
  END IF;

END $$;
