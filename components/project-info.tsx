import { Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";

export const ProjectInfo = () => {
  return (
    <div className="bg-muted p-4 mt-auto">
      <Alert className="bg-muted text-muted-foreground border-0">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          - Please note that this is a demo application.
          <br />
          - &quot;Disqualified&quot; column is not given to LLM for obvious reasons.
          <br />
          - Returning data always defaults to default set of columns. If you want to see all columns, include in prompt &quot;show all columns&quot;.
          <br />
          <div className="text-center">
            Made with ❤️ by <Link
              target="_blank"
              className="text-primary hover:text-primary/90 underline"
              href="https://tryheadquarters.com/"
            >
              Headquarters Labs
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
