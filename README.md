# OCI BOM Generator

![OCI BOM Generator](https://img.shields.io/badge/AI%20Powered-Multi--LLM-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Oracle Cloud](https://img.shields.io/badge/Oracle-Cloud%20Ready-red)

An AI-powered application that transforms natural language requirements into professional Oracle Cloud Infrastructure (OCI) Bills of Materials with real-time pricing. Perfect for cloud architects, pre-sales engineers, and solution designers.

## 🚀 Features

### **Multi-LLM AI Engine**
- **OpenAI GPT-4o**: Reliable general-purpose analysis
- **Claude 3.7 Sonnet**: Best for structured requirements analysis  
- **Google Gemini 2.5 Pro**: Superior document processing with 1M context window
- **xAI Grok-1.5**: Strong reasoning capabilities
- **DeepSeek V3**: Most cost-effective option (80% cheaper)

### **Document Intelligence**
- **PDF Processing**: Extract requirements from architectural documents
- **Excel/Word Support**: Parse existing BOMs and specifications
- **Image OCR**: Process screenshots and diagrams using advanced OCR
- **Multi-format Upload**: Drag-and-drop interface with validation

### **Real-time OCI Pricing**
- Live Oracle Cloud pricing data via official API
- Multi-currency support (USD, EUR, GBP, JPY, CAD, AUD)
- Automatic service matching and cost calculations
- Regional pricing variations

### **Professional Excel Output**
- Enterprise-ready formatting with company branding
- Detailed columns: SKU, Description, Quantity, Metrics, Pricing
- Built-in discount formulas for sales negotiations
- Monthly/annual cost breakdowns with subtotals
- Assumptions and notes worksheets

### **Intelligent Follow-up System**
- AI asks clarifying questions for ambiguous requirements
- Context-aware question generation
- Progress tracking for multi-step clarification
- Smart requirement completion

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   React     │    │   Node.js    │    │   Oracle    │
│   Frontend  │◄──►│   Backend    │◄──►│   Pricing   │
│             │    │              │    │     API     │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Multi-LLM  │
                   │   Services   │
                   │  (5 Providers)│
                   └──────────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **API Keys** for at least one LLM provider:
  - OpenAI API key
  - Anthropic API key (Claude)
  - Google AI API key (Gemini)
  - xAI API key (Grok) - *optional*
  - DeepSeek API key - *optional*

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/oci-bom-generator.git
cd oci-bom-generator
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (server + client)
npm run install-all
```

### 3. Environment Configuration
```bash
# Copy environment template
cp server/.env.example server/.env
```

**Edit `server/.env` with your API keys:**
```env
# Required - at least one LLM provider
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional LLM providers
GROK_API_KEY=your_grok_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Server configuration
PORT=3001
NODE_ENV=development

# Company branding (optional)
COMPANY_NAME="Your Company Name"
COMPANY_LOGO_URL="https://your-domain.com/logo.png"
```

### 4. Start the Application
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
npm run server  # Backend on http://localhost:3001
npm run client  # Frontend on http://localhost:3000
```

## 🎯 Usage Guide

### **Basic Workflow**

1. **Select AI Provider**
   - Choose based on your needs:
     - **Claude**: Best for complex analysis
     - **Gemini**: Best for document processing
     - **DeepSeek**: Most cost-effective

2. **Input Requirements**
   - Write natural language descriptions
   - Upload documents (PDF, Excel, Word, Images)
   - Use provided templates for common scenarios

3. **AI Analysis**
   - AI processes your requirements
   - May ask follow-up questions for clarity
   - Matches needs to OCI services

4. **Generate BOM**
   - Download professional Excel file
   - Includes pricing, formulas, and assumptions
   - Ready for client presentations

### **Example Requirements**

```text
We need a high-traffic e-commerce platform that can handle 50,000 concurrent users:

• Web application servers with auto-scaling
• MySQL database with read replicas
• Redis cache for session management  
• CDN for global content delivery
• Load balancer with SSL termination
• File storage for product images
• Development, staging, and production environments
• Estimated monthly budget: $8,000
```

### **Document Upload Tips**

- **PDFs**: Architecture diagrams, requirement documents
- **Excel**: Existing BOMs, capacity planning sheets
- **Images**: Screenshots of current infrastructure
- **Word Docs**: RFP responses, technical specifications

## 🔧 Configuration

### **LLM Provider Selection**

| Provider | Best For | Cost (per 1M tokens) | Context Window |
|----------|----------|---------------------|----------------|
| Claude 3.7 | Structured analysis | $3.00/$15.00 | 200K |
| Gemini 2.5 Pro | Document processing | $2.50/$15.00 | 1M |
| OpenAI GPT-4o | General purpose | $2.50/$10.00 | 128K |
| DeepSeek V3 | Cost efficiency | $0.27/$1.10 | 64K |

### **Rate Limiting**

- **General API**: 100 requests per 15 minutes
- **BOM Generation**: 10 requests per hour
- **Document Upload**: 20 uploads per hour
- **LLM Calls**: 200 calls per hour

### **File Upload Limits**

- **Maximum size**: 10MB per file
- **Supported formats**: PDF, XLSX, XLS, DOCX, DOC, JPG, PNG, BMP, TIFF
- **Processing timeout**: 60 seconds

## 🚀 Deployment

### **Production Build**
```bash
# Build the client
npm run build

# Set production environment
export NODE_ENV=production

# Start production server
npm start
```

### **Docker Deployment**
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### **Environment Variables**
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
```

## 🧪 Testing

### **Manual Testing Scenarios**

1. **Basic BOM Generation**
   ```bash
   # Test with simple requirements
   curl -X POST http://localhost:3001/api/generate-bom \
     -H "Content-Type: application/json" \
     -d '{"requirements": "Need 5 web servers and MySQL database", "llmProvider": "claude"}'
   ```

2. **Document Upload**
   ```bash
   # Test file upload
   curl -X POST http://localhost:3001/api/upload-document \
     -F "document=@test.pdf" \
     -F "llmProvider=gemini"
   ```

3. **Health Check**
   ```bash
   curl http://localhost:3001/api/health
   ```

## 🔒 Security Features

- **Input Validation**: Joi schema validation on all inputs
- **Rate Limiting**: Protection against abuse
- **File Sanitization**: Safe file processing with type validation
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js for security headers
- **Content Validation**: XSS and injection protection

## 📊 API Documentation

### **Generate BOM**
```
POST /api/generate-bom
Content-Type: application/json

{
  "requirements": "string (required)",
  "llmProvider": "openai|claude|gemini|grok|deepseek",
  "followUpAnswers": "object (optional)",
  "currency": "USD|EUR|GBP|JPY|CAD|AUD"
}
```

### **Upload Document**
```
POST /api/upload-document
Content-Type: multipart/form-data

document: file (required)
llmProvider: string (required)
```

### **Get LLM Providers**
```
GET /api/llm-providers

Response:
{
  "providers": [
    {
      "id": "claude",
      "name": "Claude 3.7 Sonnet",
      "cost": "$3.00/$15.00 per 1M tokens"
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### **Common Issues**

**❌ "Failed to generate BOM"**
- Check API keys are correctly set
- Verify LLM provider is selected
- Ensure requirements are not empty

**❌ "Document parsing failed"**
- Check file size (max 10MB)
- Verify file format is supported
- Try with a different LLM provider

**❌ "Rate limit exceeded"**
- Wait for the rate limit window to reset
- Consider using DeepSeek for cost-effective processing

### **Getting Help**

- 📧 **Email**: support@your-company.com
- 📖 **Documentation**: [Wiki](https://github.com/your-org/oci-bom-generator/wiki)
- 🐛 **Bug Reports**: [Issues](https://github.com/your-org/oci-bom-generator/issues)

## 🏆 Enterprise Features

Contact us for enterprise licensing with additional features:
- **White-label branding**
- **Custom LLM integrations**
- **Advanced analytics**
- **Priority support**
- **On-premises deployment**

---

**Made with ❤️ for cloud architects and pre-sales engineers**

*Oracle and Oracle Cloud Infrastructure are trademarks of Oracle Corporation.*