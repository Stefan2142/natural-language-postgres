import { Result, ResumeScore } from "@/lib/types";
import { CSVDownloadButton } from "./csv-download-button";
import { CandidateDetailModal } from "./candidate-detail-modal";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Filter, Eye } from "lucide-react";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "./ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type SortDirection = "asc" | "desc" | null;
type FilterType = "contains" | "startsWith";

interface ColumnFilter {
  value: string;
  type: FilterType;
}

export const Results = ({
  results,
  columns,
}: {
  results: Result[];
  columns: string[];
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({});
  const [showFilterFor, setShowFilterFor] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Result | null>(null);

  // Check if this table contains candidate data
  const hasCandidateData = columns.includes('candidate_name');

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = [...results];

    // Apply filters
    Object.entries(filters).forEach(([column, filter]) => {
      if (filter.value.trim()) {
        filteredData = filteredData.filter(row => {
          const cellValue = String(row[column] || "").toLowerCase();
          const filterValue = filter.value.toLowerCase();
          
          if (filter.type === "startsWith") {
            return cellValue.startsWith(filterValue);
          } else {
            return cellValue.includes(filterValue);
          }
        });
      }
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      filteredData.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === "asc" ? -1 : 1;
        if (bVal == null) return sortDirection === "asc" ? 1 : -1;
        
        // Convert to strings for comparison
        const aStr = String(aVal);
        const bStr = String(bVal);
        
        // Try numeric comparison first
        const aNum = parseFloat(aStr);
        const bNum = parseFloat(bStr);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [results, filters, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilter = (column: string, value: string, type: FilterType) => {
    setFilters(prev => ({
      ...prev,
      [column]: { value, type }
    }));
  };

  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const formatColumnTitle = (title: string) => {
    return title
      .split("_")
      .map((word, index) =>
        index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
      )
      .join(" ");
  };

  const getColumnWidth = (column: string) => {
    const col = column.toLowerCase();
    
    // Short columns (fixed narrow width)
    if (col === "id") {
      return "w-20";
    }
    
    // Medium-wide columns (wider to accommodate long headers)
    if (col.includes("fit_score") || col.includes("metadata_account")) {
      return "w-56";
    }
    
    // Medium columns (moderate width)
    if (col.includes("candidate_id") || col.includes("job_shortcode") || 
        col.includes("candidate_name") || col.includes("role_title") || 
        col.includes("metadata_email") || col.includes("metadata_stage") ||
        col.includes("created_at") || col.includes("updated_at") ||
        col === "metadata_disqualified" || col.includes("metadata_phone")) {
      return "w-48";
    }
    
    // Long text columns (wide with wrapping)
    if (col.includes("profile_about") || col.includes("contact_info") || 
        col.includes("education") || col.includes("achievements") || 
        col.includes("skills") || col.includes("rationale") || 
        col.includes("cover_letter") || col.includes("entries") || 
        col.includes("answers") || col.includes("location")) {
      return "w-80";
    }
    
    // Default medium width
    return "w-48";
  };

  const formatJsonbValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }
    
    const formatNestedValue = (val: any): string => {
      if (val === null || val === undefined) {
        return "null";
      }
      
      if (typeof val === "object" && val !== null) {
        if (Array.isArray(val)) {
          if (val.length === 0) return "[]";
          const items = val.map(item => formatNestedValue(item));
          return `[${items.join(", ")}]`;
        } else {
          const keys = Object.keys(val);
          if (keys.length === 0) return "{}";
          const pairs = keys.map(key => `${key}: ${formatNestedValue(val[key])}`);
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
        
        // Show count and preview of first few items
        const preview = value.slice(0, 2).map(item => {
          if (typeof item === "object" && item !== null) {
            // For objects, show key-value pairs with proper nested formatting
            const keys = Object.keys(item);
            if (keys.length > 0) {
              const firstKey = keys[0];
              const firstValue = formatNestedValue(item[firstKey]);
              const truncated = firstValue.length > 30 ? firstValue.substring(0, 30) + "..." : firstValue;
              return `${firstKey}: ${truncated}`;
            }
            return "{}";
          }
          return String(item);
        }).join(", ");
        
        return value.length > 2 
          ? `[${preview}... +${value.length - 2} more]`
          : `[${preview}]`;
      }
      
      // Handle objects
      if (typeof value === "object" && value !== null) {
        const keys = Object.keys(value);
        if (keys.length === 0) {
          return "{}";
        }
        
        // Show first few key-value pairs with proper nested formatting
        const preview = keys.slice(0, 3).map(key => {
          const val = formatNestedValue(value[key]);
          const truncated = val.length > 30 ? val.substring(0, 30) + "..." : val;
          return `${key}: ${truncated}`;
        }).join(", ");
        
        return keys.length > 3
          ? `{${preview}... +${keys.length - 3} more}`
          : `{${preview}}`;
      }
      
      // For primitive values
      return String(value);
      
    } catch (error) {
      // Fallback for any parsing errors
      return String(value);
    }
  };

  const formatCellValue = (column: string, value: any) => {
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
      return formatJsonbValue(value);
    }
    
    // Default string formatting
    return String(value || "");
  };

  return (
    <div className="flex-grow flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Query Results ({processedData.length} of {results.length} rows)
        </h3>
        <CSVDownloadButton data={processedData} />
      </div>
      <div className="overflow-auto max-h-[700px] border rounded-lg">
        <Table className="min-w-full divide-y divide-border table-fixed">
          <TableHeader className="bg-secondary sticky top-0 shadow-sm">
            <TableRow>
              {hasCandidateData && (
                <TableHead className="px-6 py-3 w-16">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    View
                  </span>
                </TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${getColumnWidth(column)}`}
                >
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort(column)}
                    >
                      <span>{formatColumnTitle(column)}</span>
                      {sortColumn === column && (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )
                      )}
                    </Button>
                    
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 hover:bg-muted"
                        onClick={() => setShowFilterFor(showFilterFor === column ? null : column)}
                      >
                        <Filter className={`h-3 w-3 ${filters[column] ? 'text-blue-500' : ''}`} />
                      </Button>
                      
                      {showFilterFor === column && (
                        <div className="absolute top-full left-0 z-50 w-64 p-2 mt-1 space-y-2 bg-background border rounded-md shadow-md">
                          <Input
                            placeholder="Filter value..."
                            value={filters[column]?.value || ""}
                            onChange={(e) => handleFilter(column, e.target.value, filters[column]?.type || "contains")}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={filters[column]?.type === "contains" ? "default" : "outline"}
                              onClick={() => handleFilter(column, filters[column]?.value || "", "contains")}
                            >
                              Contains
                            </Button>
                            <Button
                              size="sm"
                              variant={filters[column]?.type === "startsWith" ? "default" : "outline"}
                              onClick={() => handleFilter(column, filters[column]?.value || "", "startsWith")}
                            >
                              Starts with
                            </Button>
                          </div>
                          {filters[column] && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => clearFilter(column)}
                            >
                              Clear filter
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full"
                            onClick={() => setShowFilterFor(null)}
                          >
                            Close
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card divide-y divide-border">
            {processedData.map((candidate, index) => (
              <TableRow key={index} className="hover:bg-muted">
                {hasCandidateData && (
                  <TableCell className="px-6 py-4 w-16">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </TableCell>
                )}
                {columns.map((column, cellIndex) => {
                  const col = column.toLowerCase();
                  const isLongTextColumn = col.includes("profile_about") || col.includes("contact_info") || 
                    col.includes("education") || col.includes("achievements") || 
                    col.includes("skills") || col.includes("rationale") || 
                    col.includes("cover_letter") || col.includes("entries") || 
                    col.includes("answers") || col.includes("location");
                  
                  return (
                    <TableCell
                      key={cellIndex}
                      className={`px-6 py-4 text-sm text-foreground ${getColumnWidth(column)} ${
                        isLongTextColumn ? "break-words" : "whitespace-nowrap"
                      }`}
                    >
                      {formatCellValue(
                        column,
                        candidate[column as keyof ResumeScore],
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Candidate Detail Modal */}
      <CandidateDetailModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
      />
    </div>
  );
};
