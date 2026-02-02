import { Request, Response } from "express";
import jobService from "../services/job.service";
import { JobCreateRequest } from "../types/job.types";
import { 
  ValidationError, 
  AuthorizationError, 
  NotFoundError 
} from "../services/job.service";
import { ProposalStatus } from "../db/entity/Job.entity";

export class JobController {
  /**
   * Create a new job posting
   * POST /api/jobs
   */
  public createJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      // User is guaranteed to exist and be non-creator by middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const { owner, business, values, goals, skills, contents, platforms } = 
        req.body as JobCreateRequest & { business?: string };

      if (!owner || !values || !values.title || !values.description) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "owner, values.title, and values.description are required",
        });
      }

      const job = await jobService.createJob(
        {
          owner,
          business,
          values,
          goals: goals || [],
          skills: skills || [],
          contents: contents || [],
          platforms: platforms || [],
        },
        req.user.id
      );

      console.log(job);

      return res.status(201).json({
        success: true,
        message: "Job created successfully",
        data: job,
      });
    } catch (error) {
      return this.handleError(error, res, "Job creation failed");
    }
  }

  public getAllJobs = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const location = req.query.location as string;
      const sortBy = req.query.sortBy as "createdAt" | "payment" | undefined;
      const sortOrder = req.query.sortOrder as "ASC" | "DESC" | undefined;

      // ✅ FIXED: Removed the non-existent 'jobs' parameter
      const result = await jobService.getAllJobs({
        page,
        limit,
        category,
        location,
        sortBy,
        sortOrder,
      });

      console.log("Total jobs found:", result.total);
      console.log("Jobs:", result.jobs.length);

      return res.status(200).json({
        success: true,
        message: "Jobs retrieved successfully",
        data: result.jobs,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch jobs");
    }
  }

  public getJobById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const jobId = Number(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      const job = await jobService.getJobById(jobId, req.user?.id);

      return res.status(200).json({
        success: true,
        message: "Job retrieved successfully",
        data: job,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch job");
    }
  }

  public getJobsByOwner = async (req: Request, res: Response): Promise<Response> => {
    try {
      const ownerId = Number(req.params.ownerId);

      if (isNaN(ownerId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Owner ID must be a valid number",
        });
      }

      const jobs = await jobService.getJobsByOwner(ownerId, req.user?.id);

      return res.status(200).json({
        success: true,
        message: "Owner jobs retrieved successfully",
        data: jobs,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch owner jobs");
    }
  }

  public updateJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const jobId = Number(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      const job = await jobService.updateJob(jobId, req.body, req.user.id);

      return res.status(200).json({
        success: true,
        message: "Job updated successfully",
        data: job,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to update job");
    }
  }

  public deleteJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const jobId = Number(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      await jobService.deleteJob(jobId, req.user.id);

      return res.status(200).json({
        success: true,
        message: "Job deleted successfully",
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to delete job");
    }
  }

  public searchJobs = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = req.query.query as string;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Search query is required",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await jobService.searchJobs(query.trim(), { page, limit });

      return res.status(200).json({
        success: true,
        message: "Search completed successfully",
        data: result.jobs,
        pagination: {
          total: result.total,
          page,
          limit,
        },
      });
    } catch (error) {
      return this.handleError(error, res, "Search failed");
    }
  }

  public getJobsByCategory = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { category } = req.params;

      if (!category || category.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Category is required",
        });
      }

      const jobs = await jobService.getJobsByCategory(category.trim());

      return res.status(200).json({
        success: true,
        message: "Category jobs retrieved successfully",
        data: jobs,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch category jobs");
    }
  }

  /**
   * Create a proposal (creators only)
   */
  public createProposal = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const jobId = Number(req.params.id);
      const { title, description, proposedBudget, deliverables } = req.body;

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Proposal title is required",
        });
      }

      const proposal = await jobService.createProposal(
        jobId,
        req.user.id,
        {
          title: title.trim(),
          description,
          proposedBudget,
          deliverables,
        }
      );

      return res.status(201).json({
        success: true,
        message: "Proposal created successfully",
        data: proposal,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to create proposal");
    }
  }

  public getJobProposals = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const jobId = Number(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      const proposals = await jobService.getJobProposals(jobId, req.user.id);

      return res.status(200).json({
        success: true,
        message: "Proposals retrieved successfully",
        data: proposals,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch proposals");
    }
  }

  public getMyProposals = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const proposals = await jobService.getUserProposals(req.user.id);

      return res.status(200).json({
        success: true,
        message: "Your proposals retrieved successfully",
        data: proposals,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch your proposals");
    }
  }

  public updateProposalStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const proposalId = Number(req.params.proposalId);
      const { status } = req.body;

      if (isNaN(proposalId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Proposal ID must be a valid number",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Status is required",
        });
      }

      if (!Object.values(ProposalStatus).includes(status as ProposalStatus)) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: `Invalid status. Valid values are: ${Object.values(ProposalStatus).join(", ")}`,
        });
      }

      const proposal = await jobService.updateProposalStatus(
        proposalId,
        status as ProposalStatus,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        message: "Proposal status updated successfully",
        data: proposal,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to update proposal status");
    }
  }

  public deleteProposal = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const proposalId = Number(req.params.proposalId);

      if (isNaN(proposalId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Proposal ID must be a valid number",
        });
      }

      await jobService.deleteProposal(proposalId, req.user.id);

      return res.status(200).json({
        success: true,
        message: "Proposal deleted successfully",
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to delete proposal");
    }
  }

  public getJobStats = async (req: Request, res: Response): Promise<Response> => {
    try {
      const jobId = Number(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      const stats = await jobService.getJobStats(jobId);

      return res.status(200).json({
        success: true,
        message: "Job statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to fetch job statistics");
    }
  }

  public canApply = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const jobId = Number(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Job ID must be a valid number",
        });
      }

      const canApply = await jobService.canUserApply(jobId, req.user.id);

      return res.status(200).json({
        success: true,
        data: { canApply },
      });
    } catch (error) {
      return this.handleError(error, res, "Failed to check eligibility");
    }
  }

  private handleError(error: unknown, res: Response, defaultMessage: string): Response {
    console.error("Controller error:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: error.message,
      });
    }

    if (error instanceof AuthorizationError) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: error.message,
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: "Not found",
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : defaultMessage,
    });
  }
}

export default new JobController();
