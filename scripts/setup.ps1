# OCI BOM Generator Setup Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "🚀 OCI BOM Generator Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

# Install root dependencies
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Gray
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install server dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Install client dependencies  
Write-Host "Installing client dependencies..." -ForegroundColor Gray
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install client dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green

# Set up environment file
Write-Host "⚙️ Setting up environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path "server/.env")) {
    Copy-Item "server/.env.example" "server/.env"
    Write-Host "✅ Created server/.env from template" -ForegroundColor Green
    Write-Host "📝 Please edit server/.env and add your API keys:" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY (required)" -ForegroundColor Gray
    Write-Host "   - ANTHROPIC_API_KEY (required)" -ForegroundColor Gray  
    Write-Host "   - GEMINI_API_KEY (required)" -ForegroundColor Gray
    Write-Host "   - GROK_API_KEY (optional)" -ForegroundColor Gray
    Write-Host "   - DEEPSEEK_API_KEY (optional)" -ForegroundColor Gray
} else {
    Write-Host "⚠️ server/.env already exists, skipping template copy" -ForegroundColor Yellow
}

# Create uploads directory
$uploadsDir = "server/uploads"
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir -Force
    Write-Host "✅ Created uploads directory" -ForegroundColor Green
}

# Create logs directory
$logsDir = "server/logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force
    Write-Host "✅ Created logs directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit server/.env and add your LLM API keys" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed setup instructions, see README.md" -ForegroundColor Gray

# Open .env file for editing
$envPath = "server/.env"
if (Test-Path $envPath) {
    $openEnv = Read-Host "Would you like to open the .env file for editing now? (y/N)"
    if ($openEnv -eq "y" -or $openEnv -eq "Y") {
        try {
            Start-Process notepad.exe $envPath
        } catch {
            Write-Host "⚠️ Could not open .env file automatically. Please edit server/.env manually." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan