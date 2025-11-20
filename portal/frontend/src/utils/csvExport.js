/**
 * CSV Export Utilities
 * Handles converting resources data to CSV format
 */

/**
 * Escapes CSV field values
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts resources array to CSV string
 * @param {Array} resources - Array of resource objects
 * @returns {string} CSV formatted string
 */
export function convertResourcesToCSV(resources) {
  if (!resources || resources.length === 0) {
    return "";
  }

  // Define CSV columns
  const headers = ["Name", "Type", "Environment", "Blueprint", "Status", "PR Number", "Cost", "Health"];

  // Build CSV rows
  const rows = resources.map(resource => {
    return [
      escapeCSVField(resource.name),
      escapeCSVField(resource.type),
      escapeCSVField(resource.environment || "—"),
      escapeCSVField(resource.blueprintId || "—"),
      escapeCSVField(resource.ownershipStatus || "—"),
      escapeCSVField(resource.prNumber || "—"),
      escapeCSVField(resource.cost !== null && resource.cost !== undefined ? `$${resource.cost.toFixed(2)}` : "—"),
      escapeCSVField(resource.health || "—")
    ].join(",");
  });

  // Combine headers and rows
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Downloads a CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports filtered resources to CSV file
 * @param {Array} resources - Array of resources to export
 */
export function exportResourcesToCSV(resources) {
  const csvContent = convertResourcesToCSV(resources);

  if (!csvContent) {
    console.warn("No resources to export");
    return;
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `resources-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}
