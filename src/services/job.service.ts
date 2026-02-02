import { Job, JobProposal, ProposalStatus } from "../db/entity/Job.entity";
import { User } from "../db/entity/User";
import { Business } from "../db/entity/Business.entity";
import { BusinessMember } from "../db/entity/BusinessMember.entity";
import { JobValues, JobCreateRequest } from "../types/job.types";

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class JobService {
  /**
   * Validate job creation data
   */
  private validateJobData(data: JobCreateRequest): void {
    if (!data.values.title?.trim()) {
      throw new ValidationError("Job title is required");
    }

    if (data.values.title.length > 200) {
      throw new ValidationError("Title must be 200 characters or less");
    }

    if (!data.values.description?.trim()) {
      throw new ValidationError("Job description is required");
    }

    if (data.values.description.length < 50) {
      throw new ValidationError("Description must be at least 50 characters");
    }

    if (!data.goals || data.goals.length === 0) {
      throw new ValidationError("At least one goal is required");
    }

    if (!data.skills || data.skills.length === 0) {
      throw new ValidationError("At least one skill is required");
    }

    if (data.values.payment && isNaN(parseFloat(data.values.payment))) {
      throw new ValidationError("Payment must be a valid number");
    }
  }

  /**
   * Create a new job posting with authorization
   * FIXED: Removed deprecated getManager() and using modern approach
   */
  async createJob(data: JobCreateRequest, requesterId: number): Promise<Job> {
    // Validate input
    this.validateJobData(data);

    // Authorization check
    if (parseInt(data.owner) !== requesterId) {
      throw new AuthorizationError("You can only create jobs for yourself");
    }

    // Find owner
    const owner = await User.findOne({
      where: { id: parseInt(data.owner) },
    });

    if (!owner) {
      throw new NotFoundError("User");
    }

    // CHECK: Only brands/businesses can create jobs
    if (owner.accountType === "Creator") {
      throw new AuthorizationError("Creators cannot create jobs. Only brands and businesses can post jobs.");
    }

    let business = null;
    if (data.business) {
      business = await Business.findOne({
        where: { id: parseInt(data.business) },
        relations: ["members"],
      });

      if (!business) {
        throw new NotFoundError("Business");
      }

      // Check if user is a member of this business
      const isMember = await BusinessMember.findOne({
        where: {
          business: { id: business.id },
          user: { id: requesterId },
        },
      });

      if (!isMember) {
        throw new AuthorizationError("You are not a member of this business");
      }
    }

    // Create and save the job
    const job = Job.create({
      title: data.values.title.trim(),
      description: data.values.description.trim(),
      gender: data.values.gender,
      availability: data.values.availability,
      location: data.values.location,
      category: data.values.category,
      age: data.values.age,
      experience: data.values.experience,
      priority: data.values.priority,
      visibility: data.values.visibility,
      payment: data.values.payment,
      paymentdesc: data.values.paymentdesc,
      link: data.values.link,
      years: data.values.years,
      goals: data.goals,
      skills: data.skills,
      contents: data.contents,
      platforms: data.platforms,
      owner,
      owner_id: owner.id,
      business: business,
      business_id: business?.id || null,
      isActive: true,
    });

    const savedJob = await job.save();
    console.log("✅ Job created successfully with ID:", savedJob.id);
    
    return savedJob;
  }

  /**
   * Get all jobs with pagination and filters
   */
  async getAllJobs(options?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    sortBy?: "createdAt" | "payment";
    sortOrder?: "ASC" | "DESC";
  }): Promise<{
    jobs: Job[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    console.log("=== getAllJobs called ===");
    console.log("Options:", JSON.stringify(options, null, 2));

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    try {
      // Check total count
      const totalCount = await Job.count();
      console.log("Total jobs in DB:", totalCount);

      const activeCount = await Job.count({ where: { isActive: true } });
      console.log("Active jobs in DB:", activeCount);

      // Build query - FIXED: Proper join using owner_id and business_id
      const queryBuilder = Job.createQueryBuilder("job")
        .leftJoinAndSelect("job.owner", "owner")
        .leftJoinAndSelect("job.business", "business")
        .where("job.isActive = :isActive", { isActive: true });

      if (options?.category) {
        console.log("Adding category filter:", options.category);
        queryBuilder.andWhere("job.category = :category", {
          category: options.category,
        });
      }

      if (options?.location) {
        console.log("Adding location filter:", options.location);
        queryBuilder.andWhere("job.location ILIKE :location", {
          location: `%${options.location}%`,
        });
      }

      const sortBy = options?.sortBy || "createdAt";
      const sortOrder = options?.sortOrder || "DESC";
      queryBuilder.orderBy(`job.${sortBy}`, sortOrder);

      queryBuilder.skip(skip).take(limit);

      console.log("SQL Query:", queryBuilder.getSql());
      console.log("Parameters:", queryBuilder.getParameters());

      const [jobs, total] = await queryBuilder.getManyAndCount();

      console.log(`Found ${jobs.length} jobs out of ${total} total`);

      const totalPages = Math.ceil(total / limit);

      return {
        jobs,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch (error) {
      console.error("❌ Error in getAllJobs:", error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(id: number, requesterId?: number): Promise<Job> {
    const job = await Job.findOne({
      where: { id },
      relations: ["owner", "proposals", "proposals.proposer", "business"],
    });

    if (!job) {
      throw new NotFoundError("Job");
    }

    return job;
  }

  /**
   * Get jobs by owner
   */
  async getJobsByOwner(ownerId: number, requesterId?: number): Promise<Job[]> {
    return await Job.find({
      where: { owner_id: ownerId, isActive: true },
      relations: ["owner", "proposals", "business"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Update job with authorization
   */
  async updateJob(
    id: number,
    data: Partial<JobValues & { goals?: string[]; skills?: string[]; contents?: string[]; platforms?: string[] }>,
    requesterId: number
  ): Promise<Job> {
    const job = await Job.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundError("Job");
    }

    if (job.owner_id !== requesterId) {
      throw new AuthorizationError("You can only update your own jobs");
    }

    // Explicitly update each field
    if (data.title !== undefined) job.title = data.title;
    if (data.description !== undefined) job.description = data.description;
    if (data.gender !== undefined) job.gender = data.gender;
    if (data.availability !== undefined) job.availability = data.availability;
    if (data.location !== undefined) job.location = data.location;
    if (data.category !== undefined) job.category = data.category;
    if (data.age !== undefined) job.age = data.age;
    if (data.experience !== undefined) job.experience = data.experience;
    if (data.priority !== undefined) job.priority = data.priority;
    if (data.visibility !== undefined) job.visibility = data.visibility;
    if (data.payment !== undefined) job.payment = data.payment;
    if (data.paymentdesc !== undefined) job.paymentdesc = data.paymentdesc;
    if (data.link !== undefined) job.link = data.link;
    if (data.years !== undefined) job.years = data.years;
    if (data.goals !== undefined) job.goals = data.goals;
    if (data.skills !== undefined) job.skills = data.skills;
    if (data.contents !== undefined) job.contents = data.contents;
    if (data.platforms !== undefined) job.platforms = data.platforms;

    // Validate after update
    if (job.title && job.title.length > 200) {
      throw new ValidationError("Title must be 200 characters or less");
    }

    return await job.save();
  }

  /**
   * Delete job (soft delete) with authorization
   */
  async deleteJob(id: number, requesterId: number): Promise<boolean> {
    const job = await Job.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundError("Job");
    }

    if (job.owner_id !== requesterId) {
      throw new AuthorizationError("You can only delete your own jobs");
    }

    job.isActive = false;
    await job.save();
    return true;
  }

  /**
   * Search jobs by title, description, or skills
   */
  async searchJobs(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ jobs: Job[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [jobs, total] = await Job.createQueryBuilder("job")
      .where("job.isActive = :isActive", { isActive: true })
      .andWhere(
        "(job.title ILIKE :query OR job.description ILIKE :query)",
        { query: `%${query}%` }
      )
      .leftJoinAndSelect("job.owner", "owner")
      .leftJoinAndSelect("job.business", "business")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { jobs, total };
  }

  /**
   * Get jobs by category
   */
  async getJobsByCategory(category: string): Promise<Job[]> {
    return await Job.find({
      where: { category, isActive: true },
      relations: ["owner", "business"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Create a job proposal with validation
   */
  async createProposal(
    jobId: number,
    proposerId: number,
    data: {
      title: string;
      description?: string;
      proposedBudget?: string;
      deliverables?: string[];
    }
  ): Promise<JobProposal> {
    if (!data.title?.trim()) {
      throw new ValidationError("Proposal title is required");
    }

    const job = await Job.findOne({ where: { id: jobId } });
    const proposer = await User.findOne({ where: { id: proposerId } });

    if (!job) {
      throw new NotFoundError("Job");
    }

    if (!proposer) {
      throw new NotFoundError("User");
    }

    if (!job.isActive) {
      throw new ValidationError("Cannot propose on inactive job");
    }

    // CHECK: Only creators can create proposals
    if (proposer.accountType !== "Creator") {
      throw new AuthorizationError("Only creators can apply to jobs");
    }

    if (job.owner_id === proposerId) {
      throw new ValidationError("Cannot propose on your own job");
    }

    const existingProposal = await JobProposal.findOne({
      where: {
        job: { id: jobId },
        proposer_id: proposerId,
        status: ProposalStatus.PENDING,
      },
    });

    if (existingProposal) {
      throw new ValidationError("You already have a pending proposal for this job");
    }

    const proposal = JobProposal.create({
      title: data.title.trim(),
      description: data.description,
      proposedBudget: data.proposedBudget,
      deliverables: data.deliverables || [],
      job,
      proposer,
      proposer_id: proposerId,
      status: ProposalStatus.PENDING
    });

    return await proposal.save();
  }

  /**
   * Get proposals for a job (with authorization)
   */
  async getJobProposals(jobId: number, requesterId: number): Promise<JobProposal[]> {
    const job = await Job.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundError("Job");
    }

    if (job.owner_id !== requesterId) {
      throw new AuthorizationError("Only job owner can view proposals");
    }

    return await JobProposal.find({
      where: { job: { id: jobId } },
      relations: ["proposer"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get user's proposals
   */
  async getUserProposals(userId: number): Promise<JobProposal[]> {
    return await JobProposal.find({
      where: { proposer_id: userId },
      relations: ["job", "job.owner"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Update proposal status with authorization
   */
  async updateProposalStatus(
    proposalId: number,
    status: ProposalStatus,
    requesterId: number
  ): Promise<JobProposal> {
    const proposal = await JobProposal.findOne({
      where: { id: proposalId },
      relations: ["job"],
    });

    if (!proposal) {
      throw new NotFoundError("Proposal");
    }

    if (proposal.job.owner_id !== requesterId) {
      throw new AuthorizationError("Only job owner can update proposal status");
    }

    // Validate status transition
    const validTransitions: Record<ProposalStatus, ProposalStatus[]> = {
      [ProposalStatus.PENDING]: [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED],
      [ProposalStatus.ACCEPTED]: [ProposalStatus.COMPLETED, ProposalStatus.CANCELLED],
      [ProposalStatus.REJECTED]: [],
      [ProposalStatus.COMPLETED]: [],
      [ProposalStatus.CANCELLED]: [],
    };

    if (!validTransitions[proposal.status].includes(status)) {
      throw new ValidationError(
        `Cannot transition from ${proposal.status} to ${status}`
      );
    }

    proposal.status = status;
    return await proposal.save();
  }

  /**
   * Delete proposal with authorization
   */
  async deleteProposal(proposalId: number, requesterId: number): Promise<boolean> {
    const proposal = await JobProposal.findOne({
      where: { id: proposalId },
      relations: ["job"],
    });

    if (!proposal) {
      throw new NotFoundError("Proposal");
    }

    if (proposal.proposer_id !== requesterId && proposal.job.owner_id !== requesterId) {
      throw new AuthorizationError("Unauthorized to delete this proposal");
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new ValidationError("Can only delete pending proposals");
    }

    await proposal.remove();
    return true;
  }

  /**
   * Get job statistics
   */
  async getJobStats(jobId: number): Promise<{
    totalProposals: number;
    pendingProposals: number;
    acceptedProposals: number;
    rejectedProposals: number;
  }> {
    const proposals = await JobProposal.find({
      where: { job: { id: jobId } },
    });

    return {
      totalProposals: proposals.length,
      pendingProposals: proposals.filter((p) => p.status === ProposalStatus.PENDING).length,
      acceptedProposals: proposals.filter((p) => p.status === ProposalStatus.ACCEPTED).length,
      rejectedProposals: proposals.filter((p) => p.status === ProposalStatus.REJECTED).length,
    };
  }

  /**
   * Check if user can apply to job
   */
  async canUserApply(jobId: number, userId: number): Promise<boolean> {
    const job = await Job.findOne({ where: { id: jobId } });

    if (!job || !job.isActive) return false;
    if (job.owner_id === userId) return false;

    const existingProposal = await JobProposal.findOne({
      where: {
        job: { id: jobId },
        proposer_id: userId,
      },
    });

    return !existingProposal;
  }
}

export default new JobService();
