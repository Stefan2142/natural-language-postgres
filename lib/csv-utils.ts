import { Result } from "@/lib/types";

export function downloadCSV(data: Result[], filename: string = "resume_data.csv") {
  if (data.length === 0) {
    console.warn("No data to download");
    return;
  }

  // Get column headers from the first row
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return "";
        }
        // Convert to string and escape quotes
        const stringValue = String(value);
        // If the value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    )
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}