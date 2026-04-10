import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export interface IGeminiParsedJD {
  companyName: string;
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string;
  location: string;
}

export interface IGeminiResumeBulletResponse {
  bullets: string[];
}
