export type ApplicationStatus = 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected';

export interface IApplication {
  _id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jdLink?: string;
  notes?: string;
  dateApplied: string;
  salaryRange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFormData {
  company: string;
  role: string;
  status: string;
  jdLink?: string;
  salaryRange?: string;
  notes?: string;
}

export interface GeminiParsedJD {
  companyName: string;
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string;
  location: string;
  jdLink?: string;
}
