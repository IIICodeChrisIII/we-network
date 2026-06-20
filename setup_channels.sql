-- 1. Create RLS Policies for Channels
CREATE POLICY "Admins can create channels." ON public.channels
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can create DM channels." ON public.channels
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND name LIKE 'dm-%'
);

-- 2. Insert Elektrotechnik Channels
INSERT INTO public.channels (name, description) VALUES
('elektrotechnik-allgemein', 'Allgemeiner Austausch zur Elektrotechnik'),
('hardware-design', 'Platinen, Schaltungen, PCB Design'),
('embedded-systems', 'Mikrocontroller, FPGAs, Firmware'),
('energietechnik', 'Hochspannung, Erneuerbare Energien, Leistungselektronik'),
('automatisierung', 'SPS, Regelungstechnik, Robotik')
ON CONFLICT (id) DO NOTHING;
