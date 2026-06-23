# WE Network — Technical Setup & Overview

> **Note:** This codebase was created as part of the **TUM Science Hackathon 2026**. Our team's objective was to build a platform for Würth Elektronik to connect and engage with students.

This repository contains the frontend code for the WE Network, a platform designed to connect students with Würth Elektronik.

📚 **Non-technical users / Recruiters:** Please see the [DOCUMENTATION.md](./DOCUMENTATION.md) for a complete overview of all features, roles, and user flows.

### 🔑 Demo Accounts

You can explore the platform using the following pre-configured test accounts:

**Admin Account** (Access to Job Management, Talent Pool Database, and Admin Dashboards):
- **Email:** `admin@wuerth-test.de`
- **Password:** `WuerthAdmin2026!`

**Student / User Account** (Access to Career Portal, Live Channels, and AI Assistant):
- **Email:** `max.mustermann@wuerth-test.de`
- **Password:** `WuerthTest2026!`

## Tech Stack

The project is a Single-Page Application (SPA) utilizing modern web technologies:
- **Frontend Framework:** React 18
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **Styling:** Pure CSS with CSS Variables (no Tailwind)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Backend/Database/Auth:** Supabase JS SDK v2 (PostgreSQL, GoTrue Auth, Realtime WebSockets)

## Project Structure

The structure of the `src/` directory is organized as follows:
- `assets/`: Static files such as logos and images.
- `components/`: Reusable UI components (e.g., Sidebar, Navigation bars, Talent Pool forms).
- `lib/`: Helper scripts, especially the Supabase configuration (`supabase.js`) and external data (e.g., universities).
- `pages/`: The individual views of the application (e.g., Landing, Login, News, Channels, Career).
- `App.jsx` / `main.jsx`: Entry points and routing configuration.
- `index.css`: Global styles and CSS variables.

## Technical Setup

To run the project locally, follow these steps:

### 1. Clone the repository and install dependencies
```bash
git clone <repo-url>
cd we-network
npm install
```

### 2. Configure environment variables
Create a `.env.local` file in the root directory of the project and insert your Supabase keys:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Supabase)
Execute the provided SQL scripts in the Supabase Dashboard under "SQL Editor":
- Run the contents of `supabase/migrations/schema.sql` to create all tables and Row Level Security (RLS) Policies.
- (Optional) Run `supabase/migrations/002_insert_demo_jobs.sql` to insert test job listings.

### 4. Start the development server
```bash
npm run dev
```
The application will now be accessible at `http://localhost:5173`.

### 5. Test Data (Optional)
You can generate test users and data by running the following scripts in the terminal:
```bash
node scripts/create_test_accounts.js
node scripts/seed-test-users.mjs
```
