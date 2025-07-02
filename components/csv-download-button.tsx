import { Download } from "lucide-react";
import { Button } from "./ui/button";
import { Result } from "@/lib/types";
import { downloadCSV } from "@/lib/csv-utils";

export const CSVDownloadButton = ({ 
  data, 
  filename = "resume_data.csv",
  disabled = false 
}: { 
  data: Result[]; 
  filename?: string;
  disabled?: boolean;
}) => {
  const handleDownload = () => {
    if (data.length === 0) return;
    downloadCSV(data, filename);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={disabled || data.length === 0}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Download CSV</span>
      <span className="sm:hidden">CSV</span>
    </Button>
  );
};