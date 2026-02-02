// job.types.ts
import { JobVisibility, JobPriority, ProposalStatus } from "../db/entity/Job.entity";

export interface JobValues {
  title: string;
  description: string;
  gender?: string;
  availability?: string;
  location?: string;
  category?: string;
  age?: string;
  experience?: string;
  priority?: JobPriority;
  visibility?: JobVisibility;
  payment?: string;
  paymentdesc?: string;
  link?: string;
  years?: string;
}

export interface JobCreateRequest {
  owner: string;
  business?: string;
  values: JobValues;
  goals: string[];
  skills: string[];
  contents: string[];
  platforms: string[];
}

export interface JobResponse {
  id: number;
  title: string;
  description: string;
  gender?: string;
  availability?: string;
  location?: string;
  category?: string;
  age?: string;
  experience?: string;
  priority?: JobPriority;
  visibility: JobVisibility;
  payment?: string;
  paymentdesc?: string;
  link?: string;
  years?: string;
  goals: string[];
  skills: string[];
  contents: string[];
  platforms: string[];
  owner_id: number;
  business_id?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: number;
    name: string;
    // ... other user fields
  };
  business?: {
    id: number;
    name: string;
    // ... other business fields
  } | null;
  proposals?: ProposalResponse[];
}

export interface ProposalResponse {
  id: number;
  title: string;
  description?: string;
  proposedBudget?: string;
  deliverables: string[];
  proposer_id: number;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
  proposer?: {
    id: number;
    name: string;
    // ... other user fields
  };
}

export interface PaginatedJobsResponse {
  jobs: JobResponse[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
