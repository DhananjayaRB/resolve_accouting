import * as XLSX from 'xlsx-js-style';

/**
 * Excel styling utility functions for creating professional templates
 */

// Header style - Dark blue background with white bold text
export const headerStyle: any = {
  fill: {
    fgColor: { rgb: '1E3A8A' }, // Rich Navy Blue (MProfit theme)
  },
  font: {
    bold: true,
    color: { rgb: 'FFFFFF' }, // White text
    sz: 11,
    name: 'Inter',
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center',
    wrapText: true,
  },
  border: {
    top: { style: 'thin', color: { rgb: 'FFFFFF' } },
    bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
    left: { style: 'thin', color: { rgb: 'FFFFFF' } },
    right: { style: 'thin', color: { rgb: 'FFFFFF' } },
  },
};

// Sub-header style - Light blue background
export const subHeaderStyle: any = {
  fill: {
    fgColor: { rgb: 'E0F2FE' }, // Light blue
  },
  font: {
    bold: true,
    color: { rgb: '0C4A6E' }, // Dark blue text
    sz: 10,
  },
  alignment: {
    horizontal: 'left',
    vertical: 'center',
  },
  border: {
    top: { style: 'thin', color: { rgb: '93C5FD' } },
    bottom: { style: 'thin', color: { rgb: '93C5FD' } },
    left: { style: 'thin', color: { rgb: '93C5FD' } },
    right: { style: 'thin', color: { rgb: '93C5FD' } },
  },
};

// Title style - Large bold text
export const titleStyle: any = {
  font: {
    bold: true,
    sz: 14,
    color: { rgb: '1E3A8A' },
    name: 'Inter',
  },
  alignment: {
    horizontal: 'left',
    vertical: 'center',
  },
};

/**
 * Apply header styling to the first row of a worksheet
 */
export function styleHeaderRow(ws: XLSX.WorkSheet, columnCount: number) {
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const headerRow = headerRange.s.r; // First row index

  // Style each cell in the header row
  for (let col = 0; col < columnCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
    if (!ws[cellAddress]) {
      ws[cellAddress] = { t: 's', v: '' };
    }
    ws[cellAddress].s = headerStyle;
  }

  // Set row height for header
  if (!ws['!rows']) {
    ws['!rows'] = [];
  }
  if (!ws['!rows'][headerRow]) {
    ws['!rows'][headerRow] = { hpt: 25 }; // Height in points
  } else {
    ws['!rows'][headerRow].hpt = 25;
  }
}

/**
 * Apply styling to a specific cell
 */
export function styleCell(ws: XLSX.WorkSheet, cellAddress: string, style: any) {
  if (!ws[cellAddress]) {
    ws[cellAddress] = { t: 's', v: '' };
  }
  ws[cellAddress].s = style;
}

/**
 * Apply title styling to a cell
 */
export function styleTitleCell(ws: XLSX.WorkSheet, cellAddress: string) {
  styleCell(ws, cellAddress, titleStyle);
}

/**
 * Create a styled worksheet with headers
 */
export function createStyledWorksheet(
  data: any[],
  sheetName: string,
  options?: {
    columnWidths?: number[];
    freezeHeader?: boolean;
  }
): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Get column count from data
  const columnCount = data.length > 0 ? Object.keys(data[0]).length : 0;
  
  // Apply header styling
  if (data.length > 0) {
    styleHeaderRow(ws, columnCount);
  }
  
  // Set column widths
  if (options?.columnWidths) {
    ws['!cols'] = options.columnWidths.map(w => ({ wch: w }));
  }
  
  // Freeze header row
  if (options?.freezeHeader !== false && data.length > 0) {
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
  }
  
  return ws;
}

