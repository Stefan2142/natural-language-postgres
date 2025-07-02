import { motion } from "framer-motion";
import { Button } from "./ui/button";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    {
      desktop: "Find the strongest candidates (high positive, low negative score)",
      mobile: "Strongest",
    },
    {
      desktop: "Show all senior-level candidates",
      mobile: "Seniors",
    },
    {
      desktop: "Who is in the final interview stage?",
      mobile: "Finalists",
    },
    {
      desktop: "Count candidates in each hiring stage",
      mobile: "Pipeline Count",
    },
    {
      desktop: "Find candidates with leadership experience",
      mobile: "Leaders",
    },
    {
      desktop: "Show candidates from Mexico City",
      mobile: "From Mexico City",
    },
    {
      desktop: "Who has a negative score of 6 or higher?",
      mobile: "Red Flags",
    },
    {
      desktop: "How many applicants for the 'Senior Recruiter' role?",
      mobile: "Applicants/Role",
    },
    {
      desktop: "Find candidates who have worked at EY",
      mobile: "From EY",
    },
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
        Try these queries:
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestionQueries.map((suggestion, index) => (
          <Button
            key={index}
            className={index > 5 ? "hidden sm:inline-block" : ""}
            type="button"
            variant="outline"
            onClick={() => handleSuggestionClick(suggestion.desktop)}
          >
            <span className="sm:hidden">{suggestion.mobile}</span>
            <span className="hidden sm:inline">{suggestion.desktop}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
