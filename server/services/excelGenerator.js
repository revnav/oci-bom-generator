const ExcelJS = require('exceljs');

class ExcelGenerator {
  constructor() {
    this.defaultStyles = {
      header: {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1f4e79' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      subHeader: {
        font: { bold: true, size: 11, color: { argb: '1f4e79' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'e7f3ff' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      data: {
        font: { size: 10 },
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'cccccc' } },
          left: { style: 'thin', color: { argb: 'cccccc' } },
          bottom: { style: 'thin', color: { argb: 'cccccc' } },
          right: { style: 'thin', color: { argb: 'cccccc' } }
        }
      },
      currency: {
        font: { size: 10 },
        alignment: { horizontal: 'right', vertical: 'middle' },
        numFmt: '$#,##0.00',
        border: {
          top: { style: 'thin', color: { argb: 'cccccc' } },
          left: { style: 'thin', color: { argb: 'cccccc' } },
          bottom: { style: 'thin', color: { argb: 'cccccc' } },
          right: { style: 'thin', color: { argb: 'cccccc' } }
        }
      },
      total: {
        font: { bold: true, size: 11, color: { argb: '1f4e79' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ffd966' } },
        alignment: { horizontal: 'right', vertical: 'middle' },
        numFmt: '$#,##0.00',
        border: {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        }
      }
    };
  }

  async createBOM(bomData) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'OCI BOM Generator';
      workbook.lastModifiedBy = 'OCI BOM Generator';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create main BOM worksheet
      const worksheet = workbook.addWorksheet('OCI Bill of Materials', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToHeight: 0,
          fitToWidth: 1
        }
      });

      // Add company logo placeholder and header
      await this.addHeader(worksheet);
      
      // Add BOM table
      const startRow = await this.addBOMTable(worksheet, bomData);
      
      // Add summary and discount section
      await this.addSummarySection(worksheet, bomData, startRow);
      
      // Create a separate assumptions/notes sheet
      await this.addAssumptionsSheet(workbook, bomData);
      
      // Apply formatting and auto-sizing
      this.applyFormatting(worksheet);
      
      // Enable calculation mode to ensure formulas are calculated
      workbook.calcProperties.fullCalcOnLoad = true;
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;

    } catch (error) {
      console.error('Excel generation error:', error);
      throw new Error(`Failed to create Excel file: ${error.message}`);
    }
  }

  async addHeader(worksheet) {
    // Merge cells for company header
    worksheet.mergeCells('A1:H3');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = 'ORACLE CLOUD INFRASTRUCTURE\\nBILL OF MATERIALS';
    headerCell.style = {
      font: { bold: true, size: 18, color: { argb: '1f4e79' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f2f2f2' } }
    };

    // Add date and version info
    worksheet.getCell('I1').value = 'Generated:';
    worksheet.getCell('J1').value = new Date().toLocaleDateString();
    worksheet.getCell('I2').value = 'Version:';
    worksheet.getCell('J2').value = '1.0';
    worksheet.getCell('I3').value = 'Currency:';
    worksheet.getCell('J3').value = 'USD';

    // Add company logo placeholder
    worksheet.getCell('A4').value = '[COMPANY LOGO]';
    worksheet.getCell('A4').style = {
      font: { italic: true, color: { argb: '888888' } },
      alignment: { horizontal: 'center' }
    };

    return 5; // Next available row
  }

  async addBOMTable(worksheet, bomData) {
    let currentRow = 6;
    this.subtotalRows = []; // Track subtotal row positions

    // Table headers
    const headers = [
      'Category',
      'OCI SKU',
      'Service Description', 
      'Quantity',
      'Metric',
      'Unit Price',
      'Monthly Price',
      'Annual Price',
      'Notes'
    ];

    // Set column widths
    const columnWidths = [15, 20, 40, 10, 12, 15, 15, 15, 30];
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = columnWidths[index];
    });

    // Add headers
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.style = this.defaultStyles.header;
    });
    currentRow++;

    // Process BOM data by categories
    const categories = this.groupByCategory(bomData);
    
    Object.keys(categories).forEach(category => {
      // Category header
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const categoryCell = worksheet.getCell(currentRow, 1);
      categoryCell.value = category.toUpperCase();
      categoryCell.style = this.defaultStyles.subHeader;
      currentRow++;

      // Category items
      categories[category].forEach(item => {
        this.addBOMRow(worksheet, currentRow, item, category);
        currentRow++;
      });

      // Category subtotal
      this.addCategorySubtotal(worksheet, currentRow, category, categories[category]);
      this.subtotalRows.push(currentRow); // Track this subtotal row
      currentRow += 2; // Extra space between categories
    });

    return currentRow;
  }

  addBOMRow(worksheet, row, item, category) {
    // Calculate monthly multiplier based on metric type
    const monthlyMultiplier = this.getMonthlyMultiplier(item.metric || item.metricName);
    
    const cells = [
      { col: 1, value: '', style: this.defaultStyles.data },
      { col: 2, value: item.sku || item.partNumber, style: this.defaultStyles.data },
      { col: 3, value: item.description || item.displayName, style: this.defaultStyles.data },
      { col: 4, value: item.quantity || 1, style: { ...this.defaultStyles.data, alignment: { horizontal: 'center' } } },
      { col: 5, value: item.metric || item.metricName, style: this.defaultStyles.data },
      { col: 6, value: item.unitPrice || 0, style: this.defaultStyles.currency },
      // Monthly Price = Quantity × Unit Price × Monthly Multiplier
      // For hourly: 2 OCPUs × $0.05/hour × 744 hours/month = Monthly Cost
      // For monthly: 100 GB × $0.025/GB/month × 1 = Monthly Cost
      { col: 7, value: `=D${row}*F${row}*${monthlyMultiplier}`, style: this.defaultStyles.currency },
      { col: 8, value: `=G${row}*12`, style: this.defaultStyles.currency },
      { col: 9, value: item.notes || '', style: this.defaultStyles.data }
    ];

    cells.forEach(({ col, value, style }) => {
      const cell = worksheet.getCell(row, col);
      cell.value = value;
      cell.style = style;
    });
  }

  getMonthlyMultiplier(metric) {
    if (!metric) return 1;
    
    const metricLower = metric.toLowerCase();
    console.log(`🔢 Calculating multiplier for metric: "${metric}"`);
    
    // Hourly metrics - multiply by hours in month
    // Examples: "OCPU Hour", "Per Hour", "hour", "INSTANCE_HOUR"
    if (metricLower.includes('hour') || metricLower.includes('_hour') || metricLower.includes('/hour')) {
      console.log(`⏰ Hourly metric detected, using 744 multiplier`);
      return 744; // 24 hours * 31 days (maximum days in month for accurate estimation)
    }
    
    // Daily metrics - multiply by days in month
    if (metricLower.includes('day') || metricLower.includes('_day') || metricLower.includes('/day')) {
      console.log(`📅 Daily metric detected, using 31 multiplier`);
      return 31; // Maximum days in month
    }
    
    // Weekly metrics - multiply by weeks in month
    if (metricLower.includes('week') || metricLower.includes('_week') || metricLower.includes('/week')) {
      console.log(`📊 Weekly metric detected, using 4.33 multiplier`);
      return 4.33; // Average weeks per month (52/12)
    }
    
    // Monthly metrics - no multiplier needed
    // Examples: "GB per Month", "Per Month", "monthly", "STORAGE_GB_MONTH"
    if (metricLower.includes('month') || metricLower.includes('_month') || metricLower.includes('/month')) {
      console.log(`📆 Monthly metric detected, using 1 multiplier`);
      return 1;
    }
    
    // Yearly metrics - divide by 12 to get monthly
    if (metricLower.includes('year') || metricLower.includes('_year') || metricLower.includes('annual') || metricLower.includes('/year')) {
      console.log(`🗓️ Yearly metric detected, using 0.0833 multiplier`);
      return 0.0833; // 1/12
    }
    
    // Storage metrics (GB, TB) that are typically monthly
    // Examples: "GB", "TB", "STORAGE_GB", most storage services are monthly
    if (metricLower.includes('gb') || metricLower.includes('tb') || metricLower.includes('_storage') || metricLower.includes('storage')) {
      console.log(`💾 Storage metric detected, using 1 multiplier (typically monthly)`);
      return 1; // Usually already monthly pricing
    }
    
    // Per-request or per-transaction metrics (usually no time component)
    if (metricLower.includes('request') || metricLower.includes('transaction') || metricLower.includes('call')) {
      console.log(`🔄 Request/transaction metric detected, using 1 multiplier`);
      return 1;
    }
    
    // Default to 1 (no multiplier) for unknown metrics
    console.log(`❓ Unknown metric type, using 1 multiplier as default`);
    return 1;
  }

  addCategorySubtotal(worksheet, row, category, items) {
    worksheet.mergeCells(`A${row}:F${row}`);
    const subtotalLabel = worksheet.getCell(row, 1);
    subtotalLabel.value = `${category} Subtotal:`;
    subtotalLabel.style = this.defaultStyles.total;

    // Calculate range for SUBTOTAL function
    const startRow = row - items.length;
    const endRow = row - 1;

    const monthlySubtotal = worksheet.getCell(row, 7);
    monthlySubtotal.value = `=SUBTOTAL(109,G${startRow}:G${endRow})`;
    monthlySubtotal.style = this.defaultStyles.total;

    const annualSubtotal = worksheet.getCell(row, 8);
    annualSubtotal.value = `=SUBTOTAL(109,H${startRow}:H${endRow})`;
    annualSubtotal.style = this.defaultStyles.total;
  }

  async addSummarySection(worksheet, bomData, startRow) {
    const summaryStartRow = startRow + 3;

    // Summary header
    worksheet.mergeCells(`A${summaryStartRow}:I${summaryStartRow}`);
    const summaryHeader = worksheet.getCell(summaryStartRow, 1);
    summaryHeader.value = 'PRICING SUMMARY & DISCOUNT CALCULATOR';
    summaryHeader.style = {
      ...this.defaultStyles.header,
      font: { bold: true, size: 14, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c55a11' } }
    };

    let currentRow = summaryStartRow + 2;

    // Calculate the data range (from row 7 to the last data row, excluding category subtotals)
    const dataEndRow = startRow - 1;
    
    // Total before discount - sum only category subtotal rows
    worksheet.getCell(currentRow, 6).value = 'Total Monthly (Before Discount):';
    worksheet.getCell(currentRow, 6).style = { font: { bold: true }, alignment: { horizontal: 'right' } };
    
    // Create formulas that sum only the category subtotal rows
    if (this.subtotalRows && this.subtotalRows.length > 0) {
      const monthlySubtotalCells = this.subtotalRows.map(row => `G${row}`).join(',');
      const annualSubtotalCells = this.subtotalRows.map(row => `H${row}`).join(',');
      
      worksheet.getCell(currentRow, 7).value = `=SUM(${monthlySubtotalCells})`;
      worksheet.getCell(currentRow, 8).value = `=SUM(${annualSubtotalCells})`;
    } else {
      // Fallback to range sum if no subtotal rows tracked
      worksheet.getCell(currentRow, 7).value = `=SUM(G7:G${dataEndRow})`;
      worksheet.getCell(currentRow, 8).value = `=SUM(H7:H${dataEndRow})`;
    }
    
    worksheet.getCell(currentRow, 7).style = this.defaultStyles.currency;
    worksheet.getCell(currentRow, 8).style = this.defaultStyles.currency;
    worksheet.getCell(currentRow, 9).value = 'Total Annual (Before Discount)';
    currentRow++;

    // Discount percentage input
    worksheet.getCell(currentRow, 6).value = 'Discount Percentage:';
    worksheet.getCell(currentRow, 6).style = { font: { bold: true }, alignment: { horizontal: 'right' } };
    worksheet.getCell(currentRow, 7).value = 0;
    worksheet.getCell(currentRow, 7).style = {
      ...this.defaultStyles.data,
      numFmt: '0.00%',
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fff2cc' } }
    };
    worksheet.getCell(currentRow, 9).value = 'Enter discount % (e.g., 0.15 for 15%)';
    worksheet.getCell(currentRow, 9).style = { font: { italic: true, color: { argb: '666666' } } };
    currentRow++;

    // Discount amount
    worksheet.getCell(currentRow, 6).value = 'Discount Amount:';
    worksheet.getCell(currentRow, 6).style = { font: { bold: true }, alignment: { horizontal: 'right' } };
    worksheet.getCell(currentRow, 7).value = `=G${currentRow-2}*G${currentRow-1}`;
    worksheet.getCell(currentRow, 7).style = this.defaultStyles.currency;
    worksheet.getCell(currentRow, 8).value = `=H${currentRow-2}*G${currentRow-1}`;
    worksheet.getCell(currentRow, 8).style = this.defaultStyles.currency;
    currentRow++;

    // Final total
    worksheet.getCell(currentRow, 6).value = 'FINAL TOTAL:';
    worksheet.getCell(currentRow, 6).style = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'right' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6efce' } }
    };
    worksheet.getCell(currentRow, 7).value = `=G${currentRow-3}-G${currentRow-1}`;
    worksheet.getCell(currentRow, 7).style = {
      ...this.defaultStyles.total,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6efce' } }
    };
    worksheet.getCell(currentRow, 8).value = `=H${currentRow-3}-H${currentRow-1}`;
    worksheet.getCell(currentRow, 8).style = {
      ...this.defaultStyles.total,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6efce' } }
    };

    // Add validation for discount percentage
    worksheet.getCell(currentRow - 2, 7).dataValidation = {
      type: 'decimal',
      operator: 'between',
      formulae: [0, 1],
      showErrorMessage: true,
      errorTitle: 'Invalid Discount',
      error: 'Discount must be between 0 and 1 (0% to 100%)'
    };
  }

  async addAssumptionsSheet(workbook, bomData) {
    const assumptionsSheet = workbook.addWorksheet('Assumptions & Notes');
    
    let currentRow = 1;
    
    // Header
    assumptionsSheet.getCell(currentRow, 1).value = 'ASSUMPTIONS & IMPLEMENTATION NOTES';
    assumptionsSheet.getCell(currentRow, 1).style = {
      font: { bold: true, size: 16, color: { argb: '1f4e79' } }
    };
    currentRow += 3;

    // Add assumptions
    const assumptions = [
      'Pricing is based on Oracle Cloud Infrastructure list prices and may vary by region',
      'Monthly calculations for hourly services: Quantity × Unit Price × 744 hours/month',
      'Monthly calculations for storage services: Quantity × Unit Price (already monthly)',
      'Annual pricing is calculated as Monthly × 12 (no annual discount applied)',
      'Quantities represent actual resource units (e.g., 2 OCPUs, 100 GB storage)',
      'Actual usage may vary based on application requirements and user behavior',
      'Additional services such as support, training, and professional services not included',
      'Network egress charges may apply based on data transfer requirements',
      'Backup and disaster recovery costs calculated based on estimated data volumes',
      'Compliance and security features may require additional licensing',
      'Peak usage periods may require additional capacity planning',
      'Contact Oracle sales representative for volume discounts and enterprise agreements'
    ];

    assumptionsSheet.getCell(currentRow, 1).value = 'Key Assumptions:';
    assumptionsSheet.getCell(currentRow, 1).style = { font: { bold: true, size: 12 } };
    currentRow += 2;

    assumptions.forEach((assumption, index) => {
      assumptionsSheet.getCell(currentRow, 1).value = `${index + 1}. ${assumption}`;
      assumptionsSheet.getCell(currentRow, 1).style = { alignment: { wrapText: true } };
      assumptionsSheet.rowBreaks.push(currentRow);
      currentRow++;
    });

    // Set column width
    assumptionsSheet.getColumn(1).width = 80;
    
    // Auto-fit row heights
    assumptionsSheet.eachRow((row) => {
      row.height = undefined; // Let Excel auto-calculate
    });
  }

  createSubtotalFormula(worksheet, column, startRow, endRow) {
    // Create a formula that sums only the subtotal rows
    // We'll track subtotal row positions and create a SUM formula for those specific cells
    const subtotalCells = [];
    
    for (let row = startRow; row <= endRow; row++) {
      const cellA = worksheet.getCell(row, 1).value;
      if (cellA && typeof cellA === 'string' && cellA.includes('Subtotal:')) {
        subtotalCells.push(`${String.fromCharCode(64 + column)}${row}`);
      }
    }
    
    if (subtotalCells.length === 0) {
      return `=SUM(${String.fromCharCode(64 + column)}${startRow}:${String.fromCharCode(64 + column)}${endRow})`;
    }
    
    return `=SUM(${subtotalCells.join(',')})`;
  }

  groupByCategory(bomData) {
    const grouped = {};
    
    if (!bomData || !bomData.items) {
      return { 'General': [] };
    }

    bomData.items.forEach(item => {
      const category = item.category || item.serviceCategory || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }

  applyFormatting(worksheet) {
    // Auto-filter for the main data table
    const lastRow = worksheet.lastRow ? worksheet.lastRow.number : 50;
    worksheet.autoFilter = `A6:I${lastRow}`;

    // Freeze panes at the header row
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];

    // Set print settings
    worksheet.pageSetup.margins = {
      left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3
    };

    // Add print headers
    worksheet.pageSetup.printTitlesRow = '6:6';
  }
}

module.exports = new ExcelGenerator();