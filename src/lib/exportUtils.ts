/**
 * Export Utilities for Analytics Data
 * Supports CSV and PDF export formats
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
    headers: string[];
    rows: (string | number)[][];
    title?: string;
    dateRange?: string;
}

export interface PDFReportOptions {
    title: string;
    subtitle?: string;
    dateRange?: string;
    headers: string[];
    rows: (string | number)[][];
    summary?: {
        label: string;
        value: string | number;
    }[];
    footer?: string;
    orientation?: 'portrait' | 'landscape';
    theme?: 'striped' | 'grid' | 'plain';
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData): void {
    const { headers, rows, title } = data;

    // Create CSV content
    let csvContent = '';

    // Add title if provided
    if (title) {
        csvContent += `${title}\n\n`;
    }

    // Add headers
    csvContent += headers.join(',') + '\n';

    // Add rows
    rows.forEach((row) => {
        const escapedRow = row.map((cell) => {
            // Escape cells containing commas or quotes
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        });
        csvContent += escapedRow.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `${title?.replace(/\s+/g, '_') || 'export'}_${
        new Date().toISOString().split('T')[0]
    }.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export data to PDF format using jsPDF
 * Creates a professional, downloadable PDF report
 */
export function exportToPDF(data: ExportData): void {
    const { headers, rows, title, dateRange } = data;

    generatePDFReport({
        title: title || 'Analytics Report',
        dateRange,
        headers,
        rows,
    });
}

/**
 * Generate a professional PDF report with jsPDF
 */
export function generatePDFReport(options: PDFReportOptions): void {
    const {
        title,
        subtitle,
        dateRange,
        headers,
        rows,
        summary,
        footer,
        orientation = 'portrait',
        theme = 'striped',
    } = options;

    // Create new PDF document
    const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Brand colors
    const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
    const textColor: [number, number, number] = [31, 41, 55]; // #1f2937
    const mutedColor: [number, number, number] = [107, 114, 128]; // #6b7280

    // Add header with logo placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin, 20);

    // Subtitle or date range
    if (subtitle || dateRange) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(220, 220, 220);
        doc.text(subtitle || dateRange || '', margin, 28);
    }

    yPosition = 50;

    // Summary cards (if provided)
    if (summary && summary.length > 0) {
        const cardWidth = (pageWidth - margin * 2 - (summary.length - 1) * 10) / summary.length;
        const cardHeight = 25;

        summary.forEach((item, index) => {
            const xPos = margin + index * (cardWidth + 10);

            // Card background
            doc.setFillColor(249, 250, 251); // #f9fafb
            doc.setDrawColor(229, 231, 235); // #e5e7eb
            doc.roundedRect(xPos, yPosition, cardWidth, cardHeight, 3, 3, 'FD');

            // Label
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...mutedColor);
            doc.text(item.label, xPos + 5, yPosition + 8);

            // Value
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(...textColor);
            doc.text(String(item.value), xPos + 5, yPosition + 19);
        });

        yPosition += cardHeight + 15;
    }

    // Data table
    autoTable(doc, {
        head: [headers],
        body: rows.map(row => row.map(cell => String(cell))),
        startY: yPosition,
        margin: { left: margin, right: margin },
        theme,
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4,
        },
        bodyStyles: {
            textColor: textColor,
            fontSize: 9,
            cellPadding: 3,
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251], // #f9fafb
        },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'auto',
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => {
            // Add page number
            const pageNumber = doc.internal.pages.length - 1;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...mutedColor);
            doc.text(
                `Page ${pageNumber}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;

    if (finalY < pageHeight - 40) {
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, finalY + 10, pageWidth - margin, finalY + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...mutedColor);

        const footerText = footer || `Generated on ${new Date().toLocaleString()} | AgentBio.net`;
        doc.text(footerText, margin, finalY + 18);

        // Add AgentBio branding
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('AgentBio Intelligence', pageWidth - margin, finalY + 18, { align: 'right' });
    }

    // Generate filename
    const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${
        new Date().toISOString().split('T')[0]
    }.pdf`;

    // Download the PDF
    doc.save(filename);
}

/**
 * Export data to PDF format (legacy - opens print dialog)
 * Use generatePDFReport for direct PDF download
 */
export function exportToPDFPrint(data: ExportData): void {
    const { headers, rows, title, dateRange } = data;

    // Create a simple HTML table for PDF
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title || 'Analytics Report'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #333;
                }
                h1 {
                    color: #2563eb;
                    margin-bottom: 10px;
                }
                .date-range {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background-color: #2563eb;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e5e7eb;
                }
                tr:nth-child(even) {
                    background-color: #f9fafb;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #666;
                    font-size: 12px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h1>${title || 'Analytics Report'}</h1>
            ${dateRange ? `<div class="date-range">${dateRange}</div>` : ''}
            <table>
                <thead>
                    <tr>
                        ${headers.map((h) => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows
                        .map(
                            (row) =>
                                `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
                        )
                        .join('')}
                </tbody>
            </table>
            <div class="footer">
                Generated on ${new Date().toLocaleString()} | AgentBio.net Analytics
            </div>
        </body>
        </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
            // Close after printing (optional)
            setTimeout(() => {
                printWindow.close();
            }, 100);
        };
    }
}

/**
 * Format analytics data for export
 */
export function formatAnalyticsForExport(
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>,
    title: string = 'Search Analytics Report',
    dateRange?: string
): ExportData {
    return {
        title,
        dateRange,
        headers: ['Query', 'Clicks', 'Impressions', 'CTR', 'Avg. Position'],
        rows: queries.map((q) => [
            q.query,
            q.clicks,
            q.impressions,
            `${(q.ctr * 100).toFixed(2)}%`,
            q.position.toFixed(1),
        ]),
    };
}

/**
 * Format leads data for export
 */
export function formatLeadsForExport(
    leads: Array<{
        name: string;
        email: string;
        phone?: string;
        type: string;
        status: string;
        created_at: string;
    }>,
    title: string = 'Leads Report',
    dateRange?: string
): ExportData {
    return {
        title,
        dateRange,
        headers: ['Name', 'Email', 'Phone', 'Type', 'Status', 'Date'],
        rows: leads.map((lead) => [
            lead.name,
            lead.email,
            lead.phone || 'N/A',
            lead.type,
            lead.status,
            new Date(lead.created_at).toLocaleDateString(),
        ]),
    };
}

/**
 * Format listings data for export
 */
export function formatListingsForExport(
    listings: Array<{
        title: string;
        price: number;
        status: string;
        bedrooms: number;
        bathrooms: number;
        square_feet?: number;
    }>,
    title: string = 'Listings Report',
    dateRange?: string
): ExportData {
    return {
        title,
        dateRange,
        headers: ['Property', 'Price', 'Beds', 'Baths', 'Sq Ft', 'Status'],
        rows: listings.map((listing) => [
            listing.title,
            `$${listing.price.toLocaleString()}`,
            listing.bedrooms,
            listing.bathrooms,
            listing.square_feet || 'N/A',
            listing.status,
        ]),
    };
}
