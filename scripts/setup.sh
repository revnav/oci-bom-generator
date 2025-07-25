#!/bin/bash

# OCI BOM Generator Setup Script for Unix/Linux/macOS
# Make executable with: chmod +x scripts/setup.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 OCI BOM Generator Setup${NC}"
echo -e "${CYAN}================================${NC}"

# Check if Node.js is installed
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm version: $NPM_VERSION${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies  
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"

# Set up environment file
echo -e "${YELLOW}⚙️ Setting up environment configuration...${NC}"

if [ ! -f "server/.env" ]; then
    cp "server/.env.example" "server/.env"
    echo -e "${GREEN}✅ Created server/.env from template${NC}"
    echo -e "${YELLOW}📝 Please edit server/.env and add your API keys:${NC}"
    echo -e "${BLUE}   - OPENAI_API_KEY (required)${NC}"
    echo -e "${BLUE}   - ANTHROPIC_API_KEY (required)${NC}"
    echo -e "${BLUE}   - GEMINI_API_KEY (required)${NC}"
    echo -e "${BLUE}   - GROK_API_KEY (optional)${NC}"
    echo -e "${BLUE}   - DEEPSEEK_API_KEY (optional)${NC}"
else
    echo -e "${YELLOW}⚠️ server/.env already exists, skipping template copy${NC}"
fi

# Create uploads directory
UPLOADS_DIR="server/uploads"
if [ ! -d "$UPLOADS_DIR" ]; then
    mkdir -p "$UPLOADS_DIR"
    echo -e "${GREEN}✅ Created uploads directory${NC}"
fi

# Create logs directory
LOGS_DIR="server/logs"
if [ ! -d "$LOGS_DIR" ]; then
    mkdir -p "$LOGS_DIR"
    echo -e "${GREEN}✅ Created logs directory${NC}"
fi

# Set proper permissions
chmod 755 server/uploads 2>/dev/null || true
chmod 755 server/logs 2>/dev/null || true

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 Next steps:${NC}"
echo -e "${NC}1. Edit server/.env and add your LLM API keys${NC}"
echo -e "${NC}2. Run 'npm run dev' to start the development server${NC}"
echo -e "${NC}3. Open http://localhost:3000 in your browser${NC}"
echo ""
echo -e "${BLUE}📚 For detailed setup instructions, see README.md${NC}"

# Ask if user wants to open .env file for editing
if [ -f "server/.env" ]; then
    echo ""
    read -p "Would you like to open the .env file for editing now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Try different editors in order of preference
        if command -v code &> /dev/null; then
            code server/.env
        elif command -v nano &> /dev/null; then
            nano server/.env
        elif command -v vim &> /dev/null; then
            vim server/.env
        elif command -v vi &> /dev/null; then
            vi server/.env
        else
            echo -e "${YELLOW}⚠️ No suitable editor found. Please edit server/.env manually.${NC}"
        fi
    fi
fi

echo ""
echo -e "${CYAN}Happy coding! 🚀${NC}"

# Display helpful development commands
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo -e "${NC}  npm run dev          # Start development server${NC}"
echo -e "${NC}  npm run server       # Start backend only${NC}"
echo -e "${NC}  npm run client       # Start frontend only${NC}"
echo -e "${NC}  npm run build        # Build for production${NC}"
echo ""

# Check if we can start the development server
echo -e "${YELLOW}💡 Tip: After adding your API keys, test the setup with:${NC}"
echo -e "${BLUE}  npm run dev${NC}"
