# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Installation
```bash
# Install all dependencies for both client and server
npm run install-all

# Install individual packages
npm install                    # Root dependencies
cd server && npm install      # Server dependencies  
cd client && npm install      # Client dependencies
```

### Development
```bash
# Start both frontend and backend in development mode
npm run dev

# Start services individually
npm run server                # Backend on http://localhost:3001
npm run client                # Frontend on http://localhost:3000
```

### Testing
```bash
# Backend tests
cd server && npm test

# Frontend tests  
cd client && npm test

# Run individual test files
cd server && npx jest services/llmService.test.js
cd client && npm test -- --testNamePattern="ComponentName"
```

### Code Quality
```bash
# No specific linting commands configured
# Both client and server use default ESLint from react-scripts and jest
# Check package.json scripts for any available lint commands
```

### Production Build
```bash
# Build the client for production
npm run build
```

## Architecture Overview

This is a full-stack React/Node.js application that generates Oracle Cloud Infrastructure (OCI) Bills of Materials using multiple AI providers.

### High-Level Structure
- **Frontend**: React SPA with React Router, React Query, TailwindCSS
- **Backend**: Express.js REST API with middleware for security, validation, and rate limiting
- **AI Integration**: Multi-LLM support (OpenAI, Claude, Gemini, Grok, DeepSeek)
- **Document Processing**: PDF/Excel/Word/Image parsing with OCR capabilities
- **Data Flow**: Requirements → AI Analysis → OCI Service Matching → Excel BOM Generation

### Key Components

#### Backend Services (`server/services/`)
- **`llmService.js`**: Multi-provider AI service handling OpenAI, Anthropic, Google Gemini, xAI Grok, and DeepSeek APIs
- **`ociService.js`**: Oracle Cloud pricing API integration with caching and service matching
- **`documentParser.js`**: Document processing (PDF, Office docs, images) with OCR support
- **`excelGenerator.js`**: Professional Excel BOM generation with formatting and formulas
- **`savedPromptsService.js`**: Prompt library management with auto-save functionality

#### Frontend Architecture (`client/src/`)
- **Pages**: `BOMGenerator.js` (main), `About.js`
- **Components**: Modular React components for LLM selection, document upload, requirements input, saved prompts
- **Services**: API client (`api.js`, `savedPromptsApi.js`) using axios with React Query integration
- **State Management**: React Query for server state, local React state for UI

#### API Flow
1. User inputs requirements or uploads documents
2. Selected LLM analyzes requirements, may ask follow-up questions  
3. System matches requirements to OCI services using pricing API
4. LLM generates structured BOM data
5. Excel file created and returned as base64 for download

### Environment Configuration

The server requires API keys in `.env`:
```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here  
GEMINI_API_KEY=your_key_here
GROK_API_KEY=your_key_here      # Optional
DEEPSEEK_API_KEY=your_key_here  # Optional
PORT=3001
NODE_ENV=development
```

### Important Technical Details

- **Rate Limiting**: Applied to all `/api/` routes via middleware (`server/middleware/rateLimiter.js`)
- **File Uploads**: 10MB limit, supports PDF/Office/images, stored in `server/uploads/`
- **Client Proxy**: React dev server proxies API calls to `http://localhost:3001` (configured in `client/package.json`)
- **Security**: Helmet.js headers, CORS, input validation with Joi schemas (`server/middleware/validation.js`)
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Caching**: OCI service data cached for 1 hour to reduce API calls
- **Development Dependencies**: Uses `nodemon` for server hot-reload, `concurrently` for parallel processes

### Development Workflow

1. Both client and server run concurrently in development via `npm run dev`
2. Frontend uses proxy configuration for API calls during development
3. File uploads are handled by multer middleware with type validation in `server/index.js:26-43`
4. React Query manages server state with automatic caching and refetching
5. Toast notifications provide user feedback for all operations (react-hot-toast)
6. No formal linting setup - relies on default configurations
7. **Constraint Processing Flow**:
   - User input → `extractUserConstraints()` → Enhanced LLM prompts
   - OCI services → `validateServiceAgainstConstraints()` → Filtered services
   - BOM generation → Final validation → Compliance reporting

### Key File Locations

- **Main Entry Points**: `server/index.js`, `client/src/App.js`
- **API Routes**: All defined in `server/index.js` (no separate router files)
- **Services**: All business logic in `server/services/` directory
- **Frontend Components**: `client/src/components/` and `client/src/pages/`
- **Data Storage**: `server/data/saved-prompts.json` for prompt persistence
- **Configuration**: Environment variables in `server/.env`, proxy in `client/package.json`

### User Instruction Handling (New Feature)

The system now includes sophisticated constraint detection and enforcement:

- **Constraint Detection**: `llmService.extractUserConstraints()` automatically detects:
  - Restrictive instructions: "only consider X", "exclusively Y", "specifically Z"
  - Exclusions: "do not include", "exclude", "avoid", "no X"
  - Specific SKUs: "SKU B88317", "part number X", "service code Y"

- **Service Filtering**: OCI services are filtered BEFORE LLM processing based on detected constraints

- **Validation**: Final BOM items are validated against constraints in `validateServiceAgainstConstraints()`

- **Compliance Reporting**: Detailed logs show which items were included/excluded and why

**Critical Implementation Notes:**
- User constraints are treated as **mandatory**, not suggestions
- System never expands scope beyond user-defined limitations
- LLM prompts are enhanced with constraint information
- Service validation happens at multiple stages (pre-LLM and post-generation)