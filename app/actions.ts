"use server";

import { explanationsSchema, Result } from "@/lib/types";
import { google } from "@ai-sdk/google";
import { query as dbQuery } from "@/lib/db";
import { generateObject } from "ai";
import { z } from "zod";

export const generateQuery = async (input: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      system: `You are a SQL (PostgreSQL) and recruitment data expert. Your job is to help a user write a SQL query to retrieve candidate data based on their natural language questions. You must generate a single, complete, and valid PostgreSQL query.

The table schema is \`resume_scores\`, and its structure is as follows:

\`\`\`sql
CREATE TABLE resume_scores (
    id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(255) NOT NULL,
    candidate_name TEXT,
    role_title TEXT, -- The title of the job the candidate applied for
    job_shortcode VARCHAR(255),
    profile_about TEXT,
    contact_info TEXT,
    education TEXT,
    achievements_certificates TEXT,
    skills TEXT, -- Comma-separated list of skills
    metadata_account_subdomain TEXT,
    metadata_account_name TEXT,
    metadata_stage TEXT, -- The candidate's current stage in the hiring pipeline
    metadata_phone TEXT,
    metadata_email TEXT,
    metadata_created_at TIMESTAMP,
    metadata_updated_at TIMESTAMP,
    metadata_cover_letter TEXT,
    metadata_education_entries JSONB, -- Array of education objects
    metadata_experience_entries JSONB, -- Array of experience objects
    metadata_skills_list JSONB, -- Array of skill objects: [{"name": "Skill"}]
    metadata_answers JSONB, -- Array of question/answer objects
    metadata_location JSONB, -- Object with location details
    fit_score_positive INTEGER, -- Score from 1-10
    fit_score_negative INTEGER, -- Score from 1-10
    rationale TEXT, -- Text explaining the scores
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
\`\`\`

**Key Instructions and Querying Rules:**

1.  **Retrieval Only:** Only retrieval (\`SELECT\`) queries are allowed. Do not generate \`UPDATE\`, \`INSERT\`, or \`DELETE\` statements.

2.  **Standardized Text Searching:** For all text-based comparisons, you **must** use the \`LOWER(column_or_field) ILIKE LOWER('%search_term%')\` pattern for partial matches, or \`LOWER(column_or_field) = LOWER('exact_term')\` for exact matches. This is a strict requirement.

3.  **Understanding Scores:**
    *   \`fit_score_positive\` (integer from 1-10) indicates how well a candidate aligns with the job requirements. Higher is better.
    *   \`fit_score_negative\` (integer from 1-10) indicates the severity of red flags or misalignment. Lower is better.
    *   When a user asks for the "best", "top", or "strongest" candidates, you should order the results by \`fit_score_positive DESC, fit_score_negative ASC\`.

4.  **Using the \`rationale\` Column:** The \`rationale\` column contains a summary of why a candidate received their scores. When a user asks about a candidate's strengths, weaknesses, pros/cons, or "why" they are a good/bad fit, this is the primary column to search.

5.  **Querying JSONB Fields:** Several columns are \`JSONB\`. You must use the appropriate JSON operators (\`@>\`, \`->\`, \`->>\`) to query them. Remember to apply the standardized text search pattern to any text values you extract.
    *   **Important Pattern for JSONB Text Search:** When searching for values within JSONB fields using text casting, always use a wildcard (\`%\`) between the colon and the value to account for spaces and quotes in formatted JSON. Use \`%"key":%value%\` instead of \`%"key":"value"%\`.
    *   **\`metadata_skills_list\`:** To check if a specific skill exists, query the \`name\` key within the array. Example for 'Recruiting': \`WHERE metadata_skills_list @> '[{"name": "Recruiting"}]'::jsonb\`
    *   **\`metadata_experience_entries\`:** Query keys like \`title\` and \`company\`. Example for 'Senior Recruiter' title: \`WHERE LOWER(metadata_experience_entries::text) ILIKE LOWER('%"title":%senior recruiter%')\`
    *   **\`metadata_answers\`**: Query against question text and the answer. Example for salary <= 3000: \`SELECT * FROM resume_scores WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(metadata_answers) as answer WHERE (LOWER(answer->'question'->>'body') ILIKE LOWER('%salary expectations%')) AND ((answer->'answer'->>'number')::numeric <= 3000))\`
    *   **\`metadata_location\`**: Use the \`->>\` operator to extract the text value. Example for "Mexico City": \`WHERE LOWER(metadata_location->>'city') ILIKE LOWER('Mexico City')\`

6.  **Handling Hiring Stages (\`metadata_stage\`):** This column indicates the candidate's current position in the hiring pipeline. The values follow a specific sequence:
    1.  \`Applied\` (Earliest stage)
    2.  \`Initial Interview\`
    3.  \`Hiring Manager Interview\` (Latest stage mentioned)

    Interpret user queries about stages as follows:
    *   **Direct Stage Queries:** For requests about a specific stage, use an exact, case-insensitive equality check.
        *   *User asks:* "Show me new applicants."
        *   *Query:* \`WHERE LOWER(metadata_stage) = LOWER('Applied')\`
    *   **Progressive Queries ("At Least" / "Past"):** When a user asks about candidates who have reached or passed a certain point, include that stage and all subsequent stages using an \`IN\` clause.
        *   *User asks:* "Which candidates have been interviewed?" (This implies they are at or past the initial interview)
        *   *Query:* \`WHERE LOWER(metadata_stage) IN (LOWER('Initial Interview'), LOWER('Hiring Manager Interview'))\`
    *   **Advanced/Finalist Queries:** For general terms like "late-stage", "advanced candidates", or "finalists", map this to the latest known stage in the pipeline.
        *   *User asks:* "Who are the finalists?"
        *   *Query:* \`WHERE LOWER(metadata_stage) = LOWER('Hiring Manager Interview')\`

7.  **Default Columns:** Unless the user asks for a count, return a comprehensive selection that gives context: \`SELECT candidate_name, metadata_stage, fit_score_positive, fit_score_negative, rationale FROM resume_scores\`

8.  **Aggregation:** If the user asks for a single number (e.g., "how many candidates know Python?"), provide the count. Example: \`SELECT COUNT(*) FROM resume_scores WHERE LOWER(skills) ILIKE LOWER('%python%');\`

9.  **Determining Seniority (Senior vs. Junior):** Seniority is not a direct column and must be inferred from a candidate's work history and self-described experience. The \`role_title\` column is the job they applied for and **should NOT be used** to determine their personal experience level.
    *   **A. Analyze Job Titles in Work History:** This is the primary signal. Search for seniority keywords **only within the \`title\` key of the \`metadata_experience_entries\` JSONB array.**
        *   \`Senior Keywords: 'Senior', 'Lead', 'Principal', 'Manager', 'Head of', 'Coordinator', 'Specialist'\`
        *   \`Junior Keywords: 'Junior', 'Jr.', 'Associate', 'Intern', 'Assistant'\`
        *   *Example Query for "senior candidates":* \`WHERE LOWER(metadata_experience_entries::text) ILIKE LOWER('%"title":%senior%')\`
    *   **B. Look for Years of Experience:** When a user specifies a number of years (e.g., "more than 5 years experience"), search for this text in the \`profile_about\` and \`rationale\` columns.
        *   *Example Query for "8+ years experience":* \`WHERE LOWER(profile_about) ILIKE LOWER('%8+ years%') OR LOWER(profile_about) ILIKE LOWER('%over 8 years%') OR LOWER(rationale) ILIKE LOWER('%10 years%')\`
    *   **C. Search for Leadership/Strategy Keywords:** For queries about "leaders" or "managers," search for keywords that imply mentorship and strategic responsibility.
        *   \`Keywords: 'manage', 'mentor', 'lead', 'team', 'strategy', 'stakeholder', 'KPIs', 'SLAs', 'supervise'\`
        *   *Where to search:* \`profile_about\`, \`skills\`, \`achievements_certificates\`, and \`rationale\`.
        *   *Example Query for "candidates who have managed a team":* \`WHERE LOWER(profile_about) ILIKE LOWER('%team management%') OR LOWER(skills) ILIKE LOWER('%Leadership%') OR LOWER(rationale) ILIKE LOWER('%leading a team%')\``,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const runGenerateSQLQuery = async (query: string) => {
  "use server";
  // Check if the query is a SELECT statement
  if (
    !query.trim().toLowerCase().startsWith("select") ||
    query.trim().toLowerCase().includes("drop") ||
    query.trim().toLowerCase().includes("delete") ||
    query.trim().toLowerCase().includes("insert") ||
    query.trim().toLowerCase().includes("update") ||
    query.trim().toLowerCase().includes("alter") ||
    query.trim().toLowerCase().includes("truncate") ||
    query.trim().toLowerCase().includes("create") ||
    query.trim().toLowerCase().includes("grant") ||
    query.trim().toLowerCase().includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  let data: any;
  try {
    data = await dbQuery(query);
  } catch (e: any) {
    if (e.message.includes('relation "resume_scores_rows" does not exist')) {
      console.log(
        "Table does not exist, please check your database connection...",
      );
      // throw error
      throw Error("Table does not exist");
    } else {
      throw e;
    }
  }

  return data.rows as Result[];
};

export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        explanations: explanationsSchema,
      }),
      system: `You are a SQL (postgres) expert. Your job is to explain to the user write a SQL query you wrote to retrieve the data they asked for. The table schema is as follows:
    resume_scores (
      id serial not null,
      candidate_id character varying(255) not null,
      candidate_name character varying(255) not null,
      role_title character varying(255) not null,
      job_shortcode character varying(255) not null,
      profile_about text null,
      contact_info text null,
      education text null,
      achievements_certificates text null,
      skills text null,
      metadata_account_subdomain character varying(255) null,
      metadata_account_name character varying(255) null,
      metadata_stage character varying(100) null,
      metadata_disqualified boolean null,
      metadata_phone character varying(50) null,
      metadata_email character varying(255) null,
      metadata_created_at timestamp without time zone null,
      metadata_updated_at timestamp without time zone null,
      metadata_cover_letter text null,
      metadata_education_entries jsonb null,
      metadata_experience_entries jsonb null,
      metadata_skills_list jsonb null,
      metadata_answers jsonb null,
      metadata_location jsonb null,
      fit_score_positive integer null,
      fit_score_negative integer null,
      rationale text null,
      created_at timestamp without time zone null default CURRENT_TIMESTAMP,
      updated_at timestamp without time zone null default CURRENT_TIMESTAMP
    );

    When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM unicorns limit 20", the sections could be "SELECT *", "FROM UNICORNS", "LIMIT 20".
    If a section doesnt have any explanation, include it, but leave the explanation empty.

    `,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

