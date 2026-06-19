-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  university text,
  degree text,
  semester text,
  status text default 'student', -- student, intern, employee
  role text default 'user', -- user, admin, specialist
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Channels table
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts (News Feed)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles on delete cascade not null,
  title text not null,
  content text not null,
  type text default 'news', -- news, event, job
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs (Career)
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  department text not null,
  location text not null,
  type text not null, -- internship, working_student, full_time
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.jobs enable row level security;

-- Create basic policies (For development: allow authenticated users to read/write)
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

create policy "Channels viewable by everyone." on public.channels for select using (true);
create policy "Messages viewable by everyone." on public.messages for select using (true);
create policy "Authenticated users can insert messages." on public.messages for insert with check (auth.uid() = user_id);

create policy "Posts viewable by everyone." on public.posts for select using (true);
create policy "Jobs viewable by everyone." on public.jobs for select using (true);

-- Insert demo channels
insert into public.channels (name, description) values
('general', 'Allgemeine Diskussionen'),
('internships-2026', 'Fragen und Austausch zu Praktika 2026'),
('tech-talk', 'Diskussionen über Technologie und Trends');
