import { Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";

export const ProjectInfo = () => {
  return (
    <div className="bg-muted p-4 mt-auto">
      <Alert className="bg-muted text-muted-foreground border-0">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          This application uses the{" "}
          <Link
            target="_blank"
            className="text-primary hover:text-primary/90 underline"
            href="https://sdk.vercel.ai"
          >
            AI SDK
          </Link>{" "}
          to allow you to query a PostgreSQL database with natural language. The
          database contains candidate resume scores with fit assessments, role
          information, and detailed candidate metadata.
        </AlertDescription>
      </Alert>
    </div>
  );
};
