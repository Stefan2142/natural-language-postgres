import { z } from "zod";

export type ResumeScore = {
  id: number;
  candidate_id: string;
  candidate_name: string;
  role_title: string;
  job_shortcode: string;
  profile_about: string | null;
  contact_info: string | null;
  education: string | null;
  achievements_certificates: string | null;
  skills: string | null;
  metadata_account_subdomain: string | null;
  metadata_account_name: string | null;
  metadata_stage: string | null;
  metadata_disqualified: boolean | null;
  metadata_phone: string | null;
  metadata_email: string | null;
  metadata_created_at: Date | null;
  metadata_updated_at: Date | null;
  metadata_cover_letter: string | null;
  metadata_education_entries: any | null;
  metadata_experience_entries: any | null;
  metadata_skills_list: any | null;
  metadata_answers: any | null;
  metadata_location: any | null;
  fit_score_positive: number | null;
  fit_score_negative: number | null;
  rationale: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type Result = Record<string, string | number>;

export const explanationSchema = z.object({
  section: z.string(),
  explanation: z.string(),
});
export const explanationsSchema = z.array(explanationSchema);

export type QueryExplanation = z.infer<typeof explanationSchema>;

