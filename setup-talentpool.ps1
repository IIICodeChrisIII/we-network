# Talentpool Feature - Setup Script für Windows
# Dieses Skript führt alle notwendigen Schritte durch, um die Talentpool-Funktion zu aktivieren

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Würth Elektronik Talentpool - Setup Script               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Überprüfe Node.js und npm
Write-Host "📦 Überprüfe Abhängigkeiten..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "❌ Node.js ist nicht installiert!" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# 2. Überprüfe .env.local
Write-Host "🔐 Überprüfe Umgebungsvariablen..." -ForegroundColor Yellow
if (-not (Test-Path .env.local)) {
    Write-Host "❌ .env.local Datei nicht gefunden!" -ForegroundColor Red
    Write-Host "   Bitte erstelle die Datei mit folgenden Variablen:" -ForegroundColor White
    Write-Host "   VITE_SUPABASE_URL=<deine-supabase-url>" -ForegroundColor Gray
    Write-Host "   VITE_SUPABASE_ANON_KEY=<dein-supabase-anon-key>" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ .env.local vorhanden" -ForegroundColor Green
Write-Host ""

# 3. Abhängigkeiten installieren
Write-Host "📥 Installiere npm Abhängigkeiten..." -ForegroundColor Yellow
npm install
Write-Host "✅ Abhängigkeiten installiert" -ForegroundColor Green
Write-Host ""

# 4. Informationen zu Datenbank-Migrationen
Write-Host "🗄️  Datenbank-Migrationen:" -ForegroundColor Yellow
Write-Host "   Bitte führe in deinem Supabase Dashboard folgende Schritte durch:" -ForegroundColor White
Write-Host ""
Write-Host "   1. Öffne https://app.supabase.com" -ForegroundColor Gray
Write-Host "   2. Navigiere zu deinem Projekt → SQL Editor" -ForegroundColor Gray
Write-Host "   3. Führe folgende Dateien der Reihe nach aus:" -ForegroundColor Gray
Write-Host "      a) supabase/migrations/schema.sql" -ForegroundColor Gray
Write-Host "      b) supabase/migrations/002_insert_demo_jobs.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "   Oder: Nutze Supabase CLI:" -ForegroundColor Gray
Write-Host "   $ supabase db push" -ForegroundColor Gray
Write-Host ""

# 5. Development Server starten
Write-Host "🚀 Starte Development Server..." -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Setup abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "   1. Führe die Datenbank-Migrationen in Supabase aus (siehe oben)" -ForegroundColor White
Write-Host "   2. Starte: npm run dev" -ForegroundColor White
Write-Host "   3. Öffne http://localhost:5173 im Browser" -ForegroundColor White
Write-Host "   4. Melde dich mit einem Test-Account an" -ForegroundColor White
Write-Host "   5. Navigiere zu 'Karriere' um die neue Talentpool zu sehen" -ForegroundColor White
Write-Host ""

