// src/utils/excelExport.ts
import ExcelJS from 'exceljs';

interface Booking {
  bookingId: string;
  bookingCode: string;
  travellerName: string;
  pickupAt: string;
  dropAt: string;
  location: string;
  carModel: string;
  extraDayRate: string;
  grandTotal: number;
  commission: number;
  commissionPercentage: number;
  commissionType?: string;
  commissionValue?: string;
  commissionRate?: string;
  taxTotal: number;
  netAmount: number;
  amountOwed?: string | number; // Amount company owes to YalaRide
  status: string;
}

interface GroupedBooking {
  CompanyLocationName: string;
  locationId: string;
  bookings: Booking[];
}

interface InvoiceData {
  success: boolean;
  data: {
    invoiceNo: string;
    date: string;
    company: {
      id: string;
      name: string;
      logo: string | null;
    };
    operationalLocation: {
      id?: string;
      title?: string;
      city: string;
      country: string;
    };
    address?: {
      title: string;
      city: string;
      country: string;
    };
    operator: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    period: {
      from: string;
      to: string;
    };
    bookingsCount: number;
    groupedBookings?: GroupedBooking[]; // For multi-location
    rows?: Booking[]; // For single location
    bookingSummary: Array<{
      status: string;
      count: number;
      commission: number;
      taxableAmount: number;
    }>;
    paymentCollectionSummary: any;
    totals: {
      totalCommission?: string | number;
      totalPrepaid?: string | number;
      taxOnPrepaid?: string | number;
      netPayable?: string | number;
      totalOwes?: string | number; // Total amount company owes to YalaRide
    };
  };
  timestamp?: string;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

// Helper function to add table headers
const addTableHeaders = (worksheet: ExcelJS.Worksheet, currentRow: number) => {
  const tableHeaderRow = worksheet.getRow(currentRow);
  const headers = [
    'Booking ID',
    'Booking Code',
    'Traveller Name',
    'Pickup Date',
    'Drop Date',
    'Location Address',
    'Car Model',
    'Grand Total',
    'Commission',
    'Commission %',
    'Tax Total',
    'Net Amount',
    'Amount Owed',
    'Status'
  ];

  headers.forEach((header, index) => {
    const cell = tableHeaderRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FF2C3E50' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBDC3C7' } // Light blue-gray background
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF95A5A6' } },
      left: { style: 'thin', color: { argb: 'FF95A5A6' } },
      bottom: { style: 'thin', color: { argb: 'FF95A5A6' } },
      right: { style: 'thin', color: { argb: 'FF95A5A6' } }
    };
  });
  tableHeaderRow.height = 25;
};

// Helper function to add booking row
const addBookingRow = (worksheet: ExcelJS.Worksheet, booking: Booking, currentRow: number, index: number) => {
  const row = worksheet.getRow(currentRow);
  row.getCell(1).value = booking.bookingId;
  row.getCell(2).value = booking.bookingCode;
  row.getCell(3).value = booking.travellerName;
  row.getCell(4).value = formatDate(booking.pickupAt);
  row.getCell(5).value = formatDate(booking.dropAt);
  row.getCell(6).value = booking.location;
  row.getCell(7).value = booking.carModel;
  row.getCell(8).value = booking.grandTotal;
  row.getCell(8).numFmt = '$#,##0.00';
  row.getCell(9).value = booking.commission;
  row.getCell(9).numFmt = '$#,##0.00';
  row.getCell(10).value = `${booking.commissionPercentage}%`;
  row.getCell(11).value = booking.taxTotal;
  row.getCell(11).numFmt = '$#,##0.00';
  row.getCell(12).value = booking.netAmount;
  row.getCell(12).numFmt = '$#,##0.00';
  row.getCell(13).value = typeof booking.amountOwed === 'string' ? parseFloat(booking.amountOwed) : (booking.amountOwed || 0);
  row.getCell(13).numFmt = '$#,##0.00';
  row.getCell(14).value = booking.status;

  // Alternate row colors
  if (index % 2 === 0) {
    for (let i = 1; i <= 14; i++) {
      row.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' } // Very light gray
      };
    }
  }

  // Add borders
  for (let i = 1; i <= 14; i++) {
    row.getCell(i).border = {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
  }

  row.height = 20;
};

// Helper function to add location totals row
const addLocationTotalsRow = (worksheet: ExcelJS.Worksheet, currentRow: number, totals: {
  grandTotal: number;
  commission: number;
  tax: number;
  netAmount: number;
  amountOwed?: number;
  count: number;
}) => {
  const totalsRow = worksheet.getRow(currentRow);
  totalsRow.getCell(1).value = `TOTAL (${totals.count} bookings)`;
  totalsRow.getCell(1).font = { bold: true, size: 11 };
  totalsRow.getCell(8).value = totals.grandTotal;
  totalsRow.getCell(8).numFmt = '$#,##0.00';
  totalsRow.getCell(8).font = { bold: true };
  totalsRow.getCell(9).value = totals.commission;
  totalsRow.getCell(9).numFmt = '$#,##0.00';
  totalsRow.getCell(9).font = { bold: true };
  totalsRow.getCell(11).value = totals.tax;
  totalsRow.getCell(11).numFmt = '$#,##0.00';
  totalsRow.getCell(11).font = { bold: true };
  totalsRow.getCell(12).value = totals.netAmount;
  totalsRow.getCell(12).numFmt = '$#,##0.00';
  totalsRow.getCell(12).font = { bold: true };
  if (totals.amountOwed !== undefined) {
    totalsRow.getCell(13).value = totals.amountOwed;
    totalsRow.getCell(13).numFmt = '$#,##0.00';
    totalsRow.getCell(13).font = { bold: true };
  }

  // Style totals row
  totalsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' } // Light green background for location totals
  };

  for (let i = 1; i <= 13; i++) {
    totalsRow.getCell(i).border = {
      top: { style: 'medium', color: { argb: 'FF4CAF50' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'medium', color: { argb: 'FF4CAF50' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
  }

  totalsRow.height = 22;
};

export const exportInvoiceToExcel = async (data: InvoiceData, filename: string) => {
  const isMultiLocation = data?.data?.groupedBookings && data.data.groupedBookings.length > 0;
  const isSingleLocation = data?.data?.rows && data.data.rows.length > 0;

  if (!isMultiLocation && !isSingleLocation) {
    throw new Error('No data available to export');
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoice Report');

  // Set default column widths (removed Company Location column for multi-location)
  worksheet.columns = [
    { width: 36 }, // Booking ID
    { width: 15 }, // Booking Code
    { width: 20 }, // Traveller Name
    { width: 12 }, // Pickup Date
    { width: 12 }, // Drop Date
    { width: 50 }, // Location Address
    { width: 15 }, // Car Model
    { width: 12 }, // Grand Total
    { width: 12 }, // Commission
    { width: 12 }, // Commission %
    { width: 12 }, // Tax Total
    { width: 12 }, // Net Amount
    { width: 12 }, // Amount Owed
    { width: 12 }, // Status
  ];

  let currentRow = 1;

  // Header Section - YELLA RIDE Logo/Title
  const headerRow1 = worksheet.getRow(currentRow);
  headerRow1.getCell(1).value = 'YELLA RIDE';
  headerRow1.getCell(1).font = { size: 24, bold: true, color: { argb: 'FFF56304' } }; // Orange color #F56304
  headerRow1.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2C3E50' } // Dark blue-gray background (lighter than black)
  };
  headerRow1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(currentRow, 1, currentRow, 14);
  headerRow1.height = 30;
  currentRow++;

  const headerRow2 = worksheet.getRow(currentRow);
  headerRow2.getCell(1).value = 'INVOICE REPORT';
  headerRow2.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF34495E' } };
  headerRow2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(currentRow, 1, currentRow, 14);
  headerRow2.height = 25;
  currentRow++;

  // Empty row
  currentRow++;

  // Company Information Section
  const companyInfoHeader = worksheet.getRow(currentRow);
  companyInfoHeader.getCell(1).value = 'COMPANY INFORMATION';
  companyInfoHeader.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF2C3E50' } };
  companyInfoHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' } // Light gray background
  };
  companyInfoHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.mergeCells(currentRow, 1, currentRow, 14);
  companyInfoHeader.height = 20;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Company Name:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.company.name;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Invoice Number:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.invoiceNo;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Invoice Date:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.date;
  currentRow++;

  // Empty row
  currentRow++;

  // Location Information (only for single location)
  if (!isMultiLocation && data.data.operationalLocation?.title) {
    const locationInfoHeader = worksheet.getRow(currentRow);
    locationInfoHeader.getCell(1).value = 'LOCATION INFORMATION';
    locationInfoHeader.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF2C3E50' } };
    locationInfoHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFECF0F1' } // Light gray background
    };
    locationInfoHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, 14);
    locationInfoHeader.height = 20;
    currentRow++;

    worksheet.getRow(currentRow).getCell(1).value = 'Location:';
    worksheet.getRow(currentRow).getCell(1).font = { bold: true };
    worksheet.getRow(currentRow).getCell(2).value = data.data.operationalLocation.title;
    currentRow++;

    worksheet.getRow(currentRow).getCell(1).value = 'City:';
    worksheet.getRow(currentRow).getCell(1).font = { bold: true };
    worksheet.getRow(currentRow).getCell(2).value = data.data.operationalLocation.city;
    currentRow++;

    worksheet.getRow(currentRow).getCell(1).value = 'Country:';
    worksheet.getRow(currentRow).getCell(1).font = { bold: true };
    worksheet.getRow(currentRow).getCell(2).value = data.data.operationalLocation.country;
    currentRow++;

    // Empty row
    currentRow++;
  }

  // Period and Operator Information
  const periodInfoHeader = worksheet.getRow(currentRow);
  periodInfoHeader.getCell(1).value = 'PERIOD & OPERATOR INFORMATION';
  periodInfoHeader.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF2C3E50' } };
  periodInfoHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' } // Light gray background
  };
  periodInfoHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.mergeCells(currentRow, 1, currentRow, 14);
  periodInfoHeader.height = 20;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Period:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = `${formatDate(data.data.period.from)} to ${formatDate(data.data.period.to)}`;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Operator Name:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.operator.name;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Operator Email:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.operator.email;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Operator Phone:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.operator.phone;
  currentRow++;

  // Empty row
  currentRow++;

  // Summary Section
  const summaryHeader = worksheet.getRow(currentRow);
  summaryHeader.getCell(1).value = 'FINANCIAL SUMMARY';
  summaryHeader.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF2C3E50' } };
  summaryHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' } // Light gray background
  };
  summaryHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.mergeCells(currentRow, 1, currentRow, 14);
  summaryHeader.height = 20;
  currentRow++;

  worksheet.getRow(currentRow).getCell(1).value = 'Total Bookings:';
  worksheet.getRow(currentRow).getCell(1).font = { bold: true };
  worksheet.getRow(currentRow).getCell(2).value = data.data.bookingsCount;
  currentRow++;

  if (data.data.totals) {
    worksheet.getRow(currentRow).getCell(1).value = 'Total Commission:';
    worksheet.getRow(currentRow).getCell(1).font = { bold: true };
    worksheet.getRow(currentRow).getCell(2).value = formatCurrency(data.data.totals.totalCommission || 0);
    currentRow++;

    worksheet.getRow(currentRow).getCell(1).value = 'Total Prepaid:';
    worksheet.getRow(currentRow).getCell(1).font = { bold: true };
    worksheet.getRow(currentRow).getCell(2).value = formatCurrency(data.data.totals.totalPrepaid || 0);
    currentRow++;

    if (data.data.paymentCollectionSummary?.totalPostpaidAmount) {
      worksheet.getRow(currentRow).getCell(1).value = 'Total Postpaid:';
      worksheet.getRow(currentRow).getCell(1).font = { bold: true };
      worksheet.getRow(currentRow).getCell(2).value = formatCurrency(data.data.paymentCollectionSummary.totalPostpaidAmount);
      currentRow++;
    }

    worksheet.getRow(currentRow).getCell(1).value = 'Net Payable:';
    worksheet.getRow(currentRow).getCell(1).font = { bold: true };
    worksheet.getRow(currentRow).getCell(2).value = formatCurrency(data.data.totals.netPayable || 0);
    currentRow++;

    if (data.data.totals.totalOwes !== undefined && data.data.totals.totalOwes !== null) {
      worksheet.getRow(currentRow).getCell(1).value = 'Total Amount Owed to YalaRide:';
      worksheet.getRow(currentRow).getCell(1).font = { bold: true };
      const totalOwes = typeof data.data.totals.totalOwes === 'string' ? parseFloat(data.data.totals.totalOwes) : (data.data.totals.totalOwes || 0);
      worksheet.getRow(currentRow).getCell(2).value = formatCurrency(totalOwes);
      worksheet.getRow(currentRow).getCell(2).font = { bold: true, color: { argb: 'FFF56304' } }; // Orange color for amount owed
      currentRow++;
    }
  }

  // Empty rows
  currentRow++;
  currentRow++;

  // Handle multi-location vs single location differently
  if (isMultiLocation) {
    // Multi-location: Create sections for each location
    const overallTotals = {
      grandTotal: 0,
      commission: 0,
      tax: 0,
      netAmount: 0,
      amountOwed: 0,
      count: 0
    };

    data.data.groupedBookings!.forEach((locationGroup, locationIndex) => {
      // Location Header
      const locationHeader = worksheet.getRow(currentRow);
      locationHeader.getCell(1).value = `LOCATION: ${locationGroup.CompanyLocationName}`;
      locationHeader.getCell(1).font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      locationHeader.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3498DB' } // Blue background
      };
      locationHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.mergeCells(currentRow, 1, currentRow, 14);
      locationHeader.height = 22;
      currentRow++;

      // Empty row
      currentRow++;

      // Table Headers for this location
      addTableHeaders(worksheet, currentRow);
      currentRow++;

      // Location bookings
      const locationTotals = {
        grandTotal: 0,
        commission: 0,
        tax: 0,
        netAmount: 0,
        amountOwed: 0,
        count: locationGroup.bookings.length
      };

      locationGroup.bookings.forEach((booking, bookingIndex) => {
        addBookingRow(worksheet, booking, currentRow, bookingIndex);
        
        locationTotals.grandTotal += booking.grandTotal || 0;
        locationTotals.commission += booking.commission || 0;
        locationTotals.tax += booking.taxTotal || 0;
        locationTotals.netAmount += booking.netAmount || 0;
        const owedAmount = typeof booking.amountOwed === 'string' ? parseFloat(booking.amountOwed) : (booking.amountOwed || 0);
        locationTotals.amountOwed += owedAmount;
        
        currentRow++;
      });

      // Location Totals Row
      addLocationTotalsRow(worksheet, currentRow, locationTotals);
      currentRow++;

      // Add to overall totals
      overallTotals.grandTotal += locationTotals.grandTotal;
      overallTotals.commission += locationTotals.commission;
      overallTotals.tax += locationTotals.tax;
      overallTotals.netAmount += locationTotals.netAmount;
      overallTotals.amountOwed = (overallTotals.amountOwed || 0) + locationTotals.amountOwed;
      overallTotals.count += locationTotals.count;

      // Empty rows between locations (except last)
      if (locationIndex < data.data.groupedBookings!.length - 1) {
        currentRow++;
        currentRow++;
      }
    });

    // Empty rows before overall totals
    currentRow++;
    currentRow++;

    // Overall Totals Section
    const overallTotalsHeader = worksheet.getRow(currentRow);
    overallTotalsHeader.getCell(1).value = 'OVERALL TOTALS (ALL LOCATIONS)';
    overallTotalsHeader.getCell(1).font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    overallTotalsHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' } // Dark blue-gray background
    };
    overallTotalsHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, 14);
    overallTotalsHeader.height = 22;
    currentRow++;

    // Empty row
    currentRow++;

    // Overall totals row
    const overallTotalsRow = worksheet.getRow(currentRow);
    overallTotalsRow.getCell(1).value = `GRAND TOTAL (${overallTotals.count} bookings across ${data.data.groupedBookings!.length} locations)`;
    overallTotalsRow.getCell(1).font = { bold: true, size: 12 };
    overallTotalsRow.getCell(8).value = overallTotals.grandTotal;
    overallTotalsRow.getCell(8).numFmt = '$#,##0.00';
    overallTotalsRow.getCell(8).font = { bold: true };
    overallTotalsRow.getCell(9).value = overallTotals.commission;
    overallTotalsRow.getCell(9).numFmt = '$#,##0.00';
    overallTotalsRow.getCell(9).font = { bold: true };
    overallTotalsRow.getCell(11).value = overallTotals.tax;
    overallTotalsRow.getCell(11).numFmt = '$#,##0.00';
    overallTotalsRow.getCell(11).font = { bold: true };
    overallTotalsRow.getCell(12).value = overallTotals.netAmount;
    overallTotalsRow.getCell(12).numFmt = '$#,##0.00';
    overallTotalsRow.getCell(12).font = { bold: true };
    overallTotalsRow.getCell(13).value = overallTotals.amountOwed;
    overallTotalsRow.getCell(13).numFmt = '$#,##0.00';
    overallTotalsRow.getCell(13).font = { bold: true };

    // Style overall totals row
    overallTotalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF4E6' } // Very light orange/cream
    };

    for (let i = 1; i <= 14; i++) {
      overallTotalsRow.getCell(i).border = {
        top: { style: 'medium', color: { argb: 'FFD5A6BD' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'medium', color: { argb: 'FFD5A6BD' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }

    overallTotalsRow.height = 25;

  } else {
    // Single location: Use original format
    const bookingDetailsHeader = worksheet.getRow(currentRow);
    bookingDetailsHeader.getCell(1).value = 'BOOKING DETAILS';
    bookingDetailsHeader.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF2C3E50' } };
    bookingDetailsHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFECF0F1' } // Light gray background
    };
    bookingDetailsHeader.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, 14);
    bookingDetailsHeader.height = 20;
    currentRow++;

    // Empty row
    currentRow++;

    // Table Headers
    addTableHeaders(worksheet, currentRow);
    currentRow++;

    // Table Data
    const allBookings = data.data.rows!;
    let totalGrandTotal = 0;
    let totalCommission = 0;
    let totalTax = 0;
    let totalNetAmount = 0;
    let totalAmountOwed = 0;

    allBookings.forEach((booking, index) => {
      addBookingRow(worksheet, booking, currentRow, index);
      
      totalGrandTotal += booking.grandTotal || 0;
      totalCommission += booking.commission || 0;
      totalTax += booking.taxTotal || 0;
      totalNetAmount += booking.netAmount || 0;
      const owedAmount = typeof booking.amountOwed === 'string' ? parseFloat(booking.amountOwed) : (booking.amountOwed || 0);
      totalAmountOwed += owedAmount;
      
      currentRow++;
    });

    // Empty row
    currentRow++;

    // Totals Row
    const totalsRow = worksheet.getRow(currentRow);
    totalsRow.getCell(1).value = 'TOTAL';
    totalsRow.getCell(1).font = { bold: true, size: 12 };
    totalsRow.getCell(8).value = totalGrandTotal;
    totalsRow.getCell(8).numFmt = '$#,##0.00';
    totalsRow.getCell(8).font = { bold: true };
    totalsRow.getCell(9).value = totalCommission;
    totalsRow.getCell(9).numFmt = '$#,##0.00';
    totalsRow.getCell(9).font = { bold: true };
    totalsRow.getCell(11).value = totalTax;
    totalsRow.getCell(11).numFmt = '$#,##0.00';
    totalsRow.getCell(11).font = { bold: true };
    totalsRow.getCell(12).value = totalNetAmount;
    totalsRow.getCell(12).numFmt = '$#,##0.00';
    totalsRow.getCell(12).font = { bold: true };
    totalsRow.getCell(13).value = totalAmountOwed;
    totalsRow.getCell(13).numFmt = '$#,##0.00';
    totalsRow.getCell(13).font = { bold: true };

    // Style totals row
    totalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF4E6' } // Very light orange/cream
    };

    for (let i = 1; i <= 14; i++) {
      totalsRow.getCell(i).border = {
        top: { style: 'medium', color: { argb: 'FFD5A6BD' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'medium', color: { argb: 'FFD5A6BD' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }

    totalsRow.height = 25;
  }

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
