create table public.resume_scores (
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
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint resume_scores_pkey primary key (id),
  constraint resume_scores_fit_score_negative_check check (
    (
      (fit_score_negative >= 1)
      and (fit_score_negative <= 10)
    )
  ),
  constraint resume_scores_fit_score_positive_check check (
    (
      (fit_score_positive >= 1)
      and (fit_score_positive <= 10)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_resume_scores_candidate_id on public.resume_scores using btree (candidate_id) TABLESPACE pg_default;

create index IF not exists idx_resume_scores_job_shortcode on public.resume_scores using btree (job_shortcode) TABLESPACE pg_default;

create index IF not exists idx_resume_scores_fit_scores on public.resume_scores using btree (fit_score_positive, fit_score_negative) TABLESPACE pg_default;

create index IF not exists idx_resume_scores_created_at on public.resume_scores using btree (created_at) TABLESPACE pg_default;

create trigger update_resume_scores_updated_at BEFORE
update on resume_scores for EACH row
execute FUNCTION update_updated_at_column ();