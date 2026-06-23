#!/bin/bash

# Talentpool Feature - Setup und Deployment Script
# Dieses Skript führt alle notwendigen Schritte durch, um die Talentpool-Funktion zu aktivieren

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Würth Elektronik Talentpool - Setup Script               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Überprüfe Node.js und npm
echo "📦 Überprüfe Abhängigkeiten..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert!"
    exit 1
fi
echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# 2. Überprüfe .env.local
echo "🔐 Überprüfe Umgebungsvariablen..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local Datei nicht gefunden!"
    echo "   Bitte erstelle die Datei mit folgenden Variablen:"
    echo "   VITE_SUPABASE_URL=<deine-supabase-url>"
    echo "   VITE_SUPABASE_ANON_KEY=<dein-supabase-anon-key>"
    exit 1
fi
echo "✅ .env.local vorhanden"
echo ""

# 3. Abhängigkeiten installieren
echo "📥 Installiere npm Abhängigkeiten..."
npm install
echo "✅ Abhängigkeiten installiert"
echo ""

# 4. Informationen zu Datenbank-Migrationen
echo "🗄️  Datenbank-Migrationen:"
echo "   Bitte führe in deinem Supabase Dashboard folgende Schritte durch:"
echo ""
echo "   1. Öffne https://app.supabase.com"
echo "   2. Navigiere zu deinem Projekt → SQL Editor"
echo "   3. Führe folgende Dateien der Reihe nach aus:"
echo "      a) supabase/migrations/schema.sql"
echo "      b) supabase/migrations/002_insert_demo_jobs.sql"
echo ""
echo "   Oder: Nutze Supabase CLI:"
echo "   $ supabase db push"
echo ""

# 5. Development Server starten
echo "🚀 Starte Development Server..."
echo "   npm run dev"
echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. Führe die Datenbank-Migrationen in Supabase aus (siehe oben)"
echo "   2. Starte: npm run dev"
echo "   3. Öffne http://localhost:5173 im Browser"
echo "   4. Melde dich mit einem Test-Account an"
echo "   5. Navigiere zu 'Karriere' um die neue Talentpool zu sehen"
echo ""

