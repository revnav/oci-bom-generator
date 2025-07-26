const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const ExcelJS = require('exceljs');
const sharp = require('sharp');
const tesseract = require('node-tesseract-ocr');
const llmService = require('./llmService');

class DocumentParser {
  constructor() {
    this.supportedTypes = {
      pdf: ['.pdf'],
      excel: ['.xlsx', '.xls'],
      word: ['.docx', '.doc'],
      image: ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
      text: ['.txt']
    };
  }

  async parseDocument(file, llmProvider = 'gemini') {
    try {
      const filePath = file.path;
      const extension = path.extname(file.originalname).toLowerCase();
      
      let content = '';
      let documentType = this.getDocumentType(extension);

      switch (documentType) {
        case 'pdf':
          content = await this.parsePDF(filePath);
          break;
        case 'excel':
          content = await this.parseExcel(filePath);
          break;
        case 'word':
          content = await this.parseWord(filePath);
          break;
        case 'image':
          content = await this.parseImage(filePath);
          break;
        case 'text':
          content = await this.parseText(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }

      // Clean up uploaded file
      await this.cleanupFile(filePath);

      // Validate and sanitize content
      const sanitizedContent = this.validateContent(content);

      // Extract infrastructure keywords using regex patterns
      const infrastructureData = this.extractInfrastructureKeywords(sanitizedContent);

      // Use LLM to extract structured requirements
      const structuredContent = await llmService.parseDocumentContent(
        sanitizedContent, 
        llmProvider, 
        documentType,
        infrastructureData
      );

      return {
        originalContent: sanitizedContent,
        structuredRequirements: structuredContent,
        infrastructureData,
        documentType,
        filename: file.originalname
      };

    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  getDocumentType(extension) {
    for (const [type, extensions] of Object.entries(this.supportedTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    return 'unknown';
  }

  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async parseExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      let content = '';
      
      workbook.eachSheet((worksheet) => {
        content += `\\nSheet: ${worksheet.name}\\n`;
        content += '='.repeat(50) + '\\n';
        
        worksheet.eachRow((row, rowNumber) => {
          const values = [];
          row.eachCell((cell) => {
            values.push(cell.value || '');
          });
          content += `Row ${rowNumber}: ${values.join(' | ')}\\n`;
        });
      });
      
      return content;
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  async parseWord(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    } catch (error) {
      throw new Error(`Word document parsing failed: ${error.message}`);
    }
  }

  async parseText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Text file parsing failed: ${error.message}`);
    }
  }

  async parseImage(filePath) {
    try {
      // First, optimize the image for OCR
      const optimizedPath = filePath + '_optimized.png';
      
      await sharp(filePath)
        .resize(null, 1200, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png()
        .toFile(optimizedPath);

      // Perform OCR
      const ocrConfig = {
        lang: 'eng',
        oem: 1,
        psm: 3,
      };

      const text = await tesseract.recognize(optimizedPath, ocrConfig);
      
      // Clean up optimized image
      await this.cleanupFile(optimizedPath);
      
      return text;
    } catch (error) {
      throw new Error(`Image OCR failed: ${error.message}`);
    }
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to cleanup file ${filePath}:`, error.message);
    }
  }

  // Method to extract specific data patterns from parsed content
  extractInfrastructureKeywords(content) {
    const patterns = {
      compute: [
        /\\b(\\d+)\\s*(cpu|core|processor|vcpu|ocpu)s?\\b/gi,
        /\\b(\\d+)\\s*x\\s*\\d+\\s*(core|cpu)s?\\b/gi,
        /\\b(\\d+)\\s*(core|cpu)\\s*per\\s*(server|instance)\\b/gi
      ],
      memory: [
        /\\b(\\d+)\\s*(gb|mb|ram|memory)\\b/gi,
        /\\b(\\d+)\\s*gb\\s*ram\\b/gi,
        /\\b(\\d+)\\s*gb\\s*memory\\b/gi,
        /\\bmemory:\\s*(\\d+)\\s*gb\\b/gi
      ],
      storage: [
        /\\b(\\d+)\\s*(gb|tb|pb|storage|disk)\\b/gi,
        /\\bstorage:\\s*(\\d+)\\s*(gb|tb)\\b/gi,
        /\\b(\\d+)\\s*(gb|tb)\\s*storage\\b/gi
      ],
      network: [
        /\\b(\\d+)\\s*(mbps|gbps|bandwidth)\\b/gi,
        /\\bbandwidth:\\s*(\\d+)\\s*(mbps|gbps)\\b/gi
      ],
      instances: [
        /\\b(\\d+)\\s*(instance|server|vm|node|machine)s?\\b/gi,
        /\\bnumber\\s*of\\s*(server|instance)s?:\\s*(\\d+)\\b/gi,
        /\\b(\\d+)\\s*x\\s*(server|instance)\\b/gi
      ],
      users: [
        /\\b(\\d+)\\s*(user|concurrent|connection)s?\\b/gi,
        /\\b(\\d+)\\s*concurrent\\s*user\\b/gi,
        /\\buser\\s*capacity:\\s*(\\d+)\\b/gi
      ]
    };

    const extracted = {};
    
    Object.keys(patterns).forEach(key => {
      const allMatches = [];
      patterns[key].forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const numbers = match.match(/\\d+/g);
            if (numbers) {
              allMatches.push(...numbers.map(n => parseInt(n)));
            }
          });
        }
      });
      
      if (allMatches.length > 0) {
        // Remove duplicates and get unique values
        const uniqueValues = [...new Set(allMatches)];
        extracted[key] = uniqueValues.length === 1 ? uniqueValues : uniqueValues;
      }
    });

    return extracted;
  }

  // Method to validate and sanitize parsed content
  validateContent(content) {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid document content');
    }

    // Remove potentially harmful content
    const sanitized = content
      .replace(/[<>]/g, '') // Remove potential HTML/XML tags
      .replace(/javascript:/gi, '') // Remove JavaScript URLs
      .replace(/on\\w+=/gi, '') // Remove event handlers
      .trim();

    if (sanitized.length === 0) {
      throw new Error('Document appears to be empty or contains no readable text');
    }

    if (sanitized.length > 100000) { // 100KB limit for content
      return sanitized.substring(0, 100000) + '... (content truncated)';
    }

    return sanitized;
  }
}

module.exports = new DocumentParser();