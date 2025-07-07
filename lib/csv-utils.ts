import { Result } from "@/lib/types";

const formatJsonbValueForCSV = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  
  const formatNestedValueForCSV = (val: any): string => {
    if (val === null || val === undefined) {
      return "null";
    }
    
    if (typeof val === "object" && val !== null) {
      if (Array.isArray(val)) {
        if (val.length === 0) return "[]";
        const items = val.map(item => formatNestedValueForCSV(item));
        return `[${items.join(", ")}]`;
      } else {
        const keys = Object.keys(val);
        if (keys.length === 0) return "{}";
        const pairs = keys.map(key => `${key}: ${formatNestedValueForCSV(val[key])}`);
        return `{${pairs.join(", ")}}`;
      }
    }
    
    return String(val);
  };
  
  try {
    // If it's already a string, try to parse it as JSON
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        return value; // Return as-is if not valid JSON
      }
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "[]";
      }
      
      // For CSV, show more detail than the table view
      const formatted = value.map(item => {
        if (typeof item === "object" && item !== null) {
          // For objects, show key-value pairs with proper nested formatting
          const keys = Object.keys(item);
          if (keys.length > 0) {
            return keys.map(key => `${key}: ${formatNestedValueForCSV(item[key])}`).join("; ");
          }
          return "{}";
        }
        return String(item);
      }).join(" | ");
      
      return `[${formatted}]`;
    }
    
    // Handle objects
    if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return "{}";
      }
      
      // Show all key-value pairs for CSV with proper nested formatting
      const formatted = keys.map(key => {
        const val = formatNestedValueForCSV(value[key]);
        return `${key}: ${val}`;
      }).join("; ");
      
      return `{${formatted}}`;
    }
    
    // For primitive values
    return String(value);
    
  } catch (error) {
    // Fallback for any parsing errors
    return String(value);
  }
};

const formatCellValueForCSV = (column: string, value: any): string => {
  if (column.toLowerCase().includes("fit_score")) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      return "";
    }
    return parsedValue.toString();
  }
  if (column.toLowerCase().includes("rate")) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      return "";
    }
    const percentage = (parsedValue * 100).toFixed(2);
    return `${percentage}%`;
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (column.toLowerCase().includes("created_at") || column.toLowerCase().includes("updated_at")) {
    if (value) {
      return new Date(value).toLocaleDateString();
    }
  }
  
  // Handle JSONB columns
  const col = column.toLowerCase();
  if (col.includes("entries") || col.includes("answers") || col.includes("location") || col.includes("skills_list")) {
    return formatJsonbValueForCSV(value);
  }
  
  // Default string formatting
  return String(value || "");
};

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
        // Format the value using the same logic as the table
        const formattedValue = formatCellValueForCSV(header, value);
        // If the value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (formattedValue.includes(",") || formattedValue.includes("\n") || formattedValue.includes('"')) {
          return `"${formattedValue.replace(/"/g, '""')}"`;
        }
        return formattedValue;
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