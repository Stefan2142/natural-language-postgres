import { Result, ResumeScore } from "@/lib/types";
import { CSVDownloadButton } from "./csv-download-button";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Filter } from "lucide-react";
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
    // Truncate long text fields for better display
    if (column.toLowerCase().includes("rationale") || column.toLowerCase().includes("education") || column.toLowerCase().includes("contact_info")) {
      const text = String(value || "");
      if (text.length > 100) {
        return text.substring(0, 100) + "...";
      }
      return text;
    }
    return String(value);
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
        <Table className="min-w-full divide-y divide-border">
          <TableHeader className="bg-secondary sticky top-0 shadow-sm">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
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
                {columns.map((column, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className={`px-6 py-4 text-sm text-foreground ${
                      column.toLowerCase().includes("rationale") || 
                      column.toLowerCase().includes("education") || 
                      column.toLowerCase().includes("contact_info")
                        ? "max-w-xs"
                        : "whitespace-nowrap"
                    }`}
                  >
                    {formatCellValue(
                      column,
                      candidate[column as keyof ResumeScore],
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
