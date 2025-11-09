/**
 * Export Utilities for Analytics Data
 * Supports CSV and PDF export formats
 */

interface ExportData {
    headers: string[];
    rows: (string | number)[][];
    title?: string;
    dateRange?: string;
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
 * Export data to PDF format (simple text-based PDF)
 */
export function exportToPDF(data: ExportData): void {
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
