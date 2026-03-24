// ─── Shared TypeScript types across web and mobile ────────────────────────────

export type UserRole = 'job_seeker' | 'recruiter' | 'admin'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
export type JobStatus = 'draft' | 'active' | 'closed' | 'paused'
export type ApplicationStatus =
  | 'applied' | 'screening' | 'shortlisted' | 'interview' | 'offer' | 'rejected' | 'withdrawn'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

export interface Resume {
  id: string
  owner_id: string
  title: string
  is_master: boolean
  file_name: string | null
  file_url: string | null
  processing_status: ProcessingStatus
  parsed_data: ParsedResumeData | null
}

export interface ParsedResumeData {
  name?: string
  email?: string
  phone?: string
  years_of_experience?: number
  skills: string[]
  sections?: Record<string, string>
}

export interface JobListing {
  id: string
  recruiter_id: string
  title: string
  company: string
  location: string | null
  is_remote: boolean
  job_type: JobType
  experience_level: ExperienceLevel
  salary_min?: number
  salary_max?: number
  salary_currency: string
  description: string
  status: JobStatus
}

export interface SkillDetail {
  skill_name: string
  weight?: number
  is_required?: boolean
  importance?: string
}

export interface MatchResult {
  id: string
  resume_id: string
  job_id: string
  overall_score: number
  semantic_score: number
  skill_score: number
  experience_score: number
  education_score: number
  matched_skills: SkillDetail[]
  partial_skills: SkillDetail[]
  missing_skills: SkillDetail[]
  explanation: string | null
  is_shortlisted: boolean
}

export interface LearningRecommendation {
  id: string
  skill_name: string
  resource_type: string
  resource_title: string
  resource_provider: string | null
  resource_url: string | null
  estimated_hours: number | null
  priority: number
}

export interface FullMatchAnalysis {
  match_result: MatchResult
  skill_gaps: SkillGap[]
  recommendations: LearningRecommendation[]
}

export interface SkillGap {
  id: string
  skill_name: string
  skill_category: string | null
  importance: 'critical' | 'high' | 'medium' | 'low'
  gap_type: 'missing' | 'insufficient'
}
