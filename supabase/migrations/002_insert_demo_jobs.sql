-- Demo Job Listings
INSERT INTO public.jobs (title, department, location, type, description) VALUES
  ('Hardware Engineer - Praktikum', 'Hardware Engineering', 'Künzelsau', 'internship',
   'Wir suchen motivierte Praktikanten für unser Hardware Engineering Team. Du wirst an der Entwicklung von innovativen elektronischen Lösungen mitarbeiten und praktische Erfahrungen mit modernen Entwicklungstools sammeln.'),
  ('Fullstack Developer - HiWi', 'Software Development', 'Künzelsau', 'working_student',
   'Als studentische Hilfskraft unterstützt du unser Team in der Softwareentwicklung. Du arbeitest mit React, Node.js und modernen Entwicklungsmethoden. Eine großartige Gelegenheit, praktische Erfahrung zu sammeln.'),
  ('Embedded Systems Engineer', 'Hardware Engineering', 'Künzelsau', 'full_time',
   'Vollzeitstelle für erfahrene Entwickler mit Fokus auf Embedded Systems. Du wirst an der Entwicklung von Firmware und Hardware-Treibern arbeiten.')
ON CONFLICT DO NOTHING;

