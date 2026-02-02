import { Request, Response } from "express";
import campaignService from "../services/campaign.service";

export class CampaignController {
  public async createCampaign(req: Request, res: Response): Promise<Response> {
try {
    // Log the incoming request for debugging
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { title, description, goals, budget, createdby, cocampaign, jobId,milestones } = req.body;

    // Validation with detailed error messages
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Request body is empty or invalid JSON",
        details: "Please ensure you're sending valid JSON data with Content-Type: application/json"
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        error: "Validation Error",
        message: "Campaign title is required",
        details: "The 'title' field must be provided and cannot be empty"
      });
    }

    // Optional: Add more validations
    if (title.length > 200) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Campaign title is too long",
        details: "Title must be 200 characters or less"
      });
    }

    if (budget && (isNaN(Number(budget)) || Number(budget) < 0)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Invalid budget value",
        details: "Budget must be a positive number"
      });
    }

    const campaign = await campaignService.createCampaign({
      title: title.trim(),
      description: description?.trim(),
      goals,
      budget: budget ? Number(budget) : 0,
      createdby,
      cocampaign,
      jobId,
      milestones
    });

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create campaign",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
      return res.status(500).json({
        error: "Campaign creation failed",
        message: "Internal server error while creating campaign",
      });
    }
  }

  public async getAllCampaigns(req: Request, res: Response): Promise<Response> {
    try {
      const campaigns = await campaignService.getAllCampaigns();

      return res.status(200).json({
        message: "Campaigns retrieved successfully",
        data: campaigns,
      });
    } catch (error) {
      console.error("Get all campaigns error:", error);
      return res.status(500).json({
        error: "Fetch campaigns failed",
        message: "Internal server error while fetching campaigns",
      });
    }
  }

  public async getCampaignById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      const campaign = await campaignService.getCampaignById(campaignId);

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: `Campaign with ID ${campaignId} not found`,
        });
      }

      return res.status(200).json({
        message: "Campaign retrieved successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Get campaign error:", error);
      return res.status(500).json({
        error: "Fetch campaign failed",
        message: "Internal server error while fetching campaign",
      });
    }
  }

  public async updateCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      const { title, description, goals, budget, active, cocampaign } = req.body;

      const campaign = await campaignService.updateCampaign(campaignId, {
        title,
        description,
        goals,
        budget: budget ? Number(budget) : undefined,
        active,
        cocampaign,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: `Campaign with ID ${campaignId} not found`,
        });
      }

      return res.status(200).json({
        message: "Campaign updated successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Update campaign error:", error);
      return res.status(500).json({
        error: "Campaign update failed",
        message: "Internal server error while updating campaign",
      });
    }
  }

  public async deleteCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      const deleted = await campaignService.deleteCampaign(campaignId);

      if (!deleted) {
        return res.status(404).json({
          error: "Campaign not found",
          message: `Campaign with ID ${campaignId} not found`,
        });
      }

      return res.status(200).json({
        message: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error("Delete campaign error:", error);
      return res.status(500).json({
        error: "Campaign deletion failed",
        message: "Internal server error while deleting campaign",
      });
    }
  }

  public async addMilestone(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);
      const { title, description, objectives, category, start, end, status, budget } = req.body;

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      if (!title || !description) {
        return res.status(400).json({
          error: "Milestone creation failed",
          message: "Title and description are required",
        });
      }

      const campaign = await campaignService.addMilestone(campaignId, {
        title,
        description,
        objectives,
        category,
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        status: status || "In Progress",
        budget: budget ? Number(budget) : undefined,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: `Campaign with ID ${campaignId} not found`,
        });
      }

      return res.status(201).json({
        message: "Milestone added successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Add milestone error:", error);
      return res.status(500).json({
        error: "Milestone creation failed",
        message: "Internal server error while adding milestone",
      });
    }
  }

  public async updateMilestone(req: Request, res: Response): Promise<Response> {
    try {
      const { id, milestoneId } = req.params;
      const campaignId = Number(id);
      const mId = Number(milestoneId);

      if (isNaN(campaignId) || isNaN(mId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID and Milestone ID must be numbers",
        });
      }

      const { title, description, objectives, category, start, end, status, budget } = req.body;

      const milestone = await campaignService.updateMilestone(campaignId, mId, {
        title,
        description,
        objectives,
        category,
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        status,
        budget: budget ? Number(budget) : undefined,
      });

      if (!milestone) {
        return res.status(404).json({
          error: "Milestone not found",
          message: `Milestone with ID ${mId} not found in campaign ${campaignId}`,
        });
      }

      return res.status(200).json({
        message: "Milestone updated successfully",
        data: milestone,
      });
    } catch (error) {
      console.error("Update milestone error:", error);
      return res.status(500).json({
        error: "Milestone update failed",
        message: "Internal server error while updating milestone",
      });
    }
  }

  public async deleteMilestone(req: Request, res: Response): Promise<Response> {
    try {
      const { id, milestoneId } = req.params;
      const campaignId = Number(id);
      const mId = Number(milestoneId);

      if (isNaN(campaignId) || isNaN(mId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID and Milestone ID must be numbers",
        });
      }

      const deleted = await campaignService.deleteMilestone(campaignId, mId);

      if (!deleted) {
        return res.status(404).json({
          error: "Milestone not found",
          message: `Milestone with ID ${mId} not found`,
        });
      }

      return res.status(200).json({
        message: "Milestone deleted successfully",
      });
    } catch (error) {
      console.error("Delete milestone error:", error);
      return res.status(500).json({
        error: "Milestone deletion failed",
        message: "Internal server error while deleting milestone",
      });
    }
  }

  public async addTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);
      const { name, members } = req.body;

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      if (!name) {
        return res.status(400).json({
          error: "Team creation failed",
          message: "Team name is required",
        });
      }

      const campaign = await campaignService.addTeam(campaignId, {
        name,
        members,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: `Campaign with ID ${campaignId} not found`,
        });
      }

      return res.status(201).json({
        message: "Team added successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Add team error:", error);
      return res.status(500).json({
        error: "Team creation failed",
        message: "Internal server error while adding team",
      });
    }
  }

  public async deleteTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { id, teamId } = req.params;
      const campaignId = Number(id);
      const tId = Number(teamId);

      if (isNaN(campaignId) || isNaN(tId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID and Team ID must be numbers",
        });
      }

      const deleted = await campaignService.deleteTeam(campaignId, tId);

      if (!deleted) {
        return res.status(404).json({
          error: "Team not found",
          message: `Team with ID ${tId} not found`,
        });
      }

      return res.status(200).json({
        message: "Team deleted successfully",
      });
    } catch (error) {
      console.error("Delete team error:", error);
      return res.status(500).json({
        error: "Team deletion failed",
        message: "Internal server error while deleting team",
      });
    }
  }

  public async addFeedback(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);
      const { name, email, feedback, desc } = req.body;

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      if (!feedback) {
        return res.status(400).json({
          error: "Feedback creation failed",
          message: "Feedback text is required",
        });
      }

      const campaign = await campaignService.addFeedback(campaignId, {
        name,
        email,
        feedback,
        desc,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: `Campaign with ID ${campaignId} not found`,
        });
      }

      return res.status(201).json({
        message: "Feedback added successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Add feedback error:", error);
      return res.status(500).json({
        error: "Feedback creation failed",
        message: "Internal server error while adding feedback",
      });
    }
  }

  public async getCampaignFeedback(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const campaignId = Number(id);

      if (isNaN(campaignId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      const feedback = await campaignService.getCampaignFeedback(campaignId);

      return res.status(200).json({
        message: "Feedback retrieved successfully",
        data: feedback,
      });
    } catch (error) {
      console.error("Get feedback error:", error);
      return res.status(500).json({
        error: "Fetch feedback failed",
        message: "Internal server error while fetching feedback",
      });
    }
  }

  public async deleteFeedback(req: Request, res: Response): Promise<Response> {
    try {
      const { id, feedbackId } = req.params;
      const campaignId = Number(id);
      const fId = Number(feedbackId);

      if (isNaN(campaignId) || isNaN(fId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID and Feedback ID must be numbers",
        });
      }

      const deleted = await campaignService.deleteFeedback(campaignId, fId);

      if (!deleted) {
        return res.status(404).json({
          error: "Feedback not found",
          message: `Feedback with ID ${fId} not found`,
        });
      }

      return res.status(200).json({
        message: "Feedback deleted successfully",
      });
    } catch (error) {
      console.error("Delete feedback error:", error);
      return res.status(500).json({
        error: "Feedback deletion failed",
        message: "Internal server error while deleting feedback",
      });
    }
  }

  public async searchCampaigns(req: Request, res: Response): Promise<Response> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Search failed",
          message: "Search query is required",
        });
      }

      const campaigns = await campaignService.searchCampaigns(query);

      return res.status(200).json({
        message: "Search completed successfully",
        data: campaigns,
      });
    } catch (error) {
      console.error("Search campaigns error:", error);
      return res.status(500).json({
        error: "Search failed",
        message: "Internal server error while searching campaigns",
      });
    }
  }

  public async getCampaignsByUser(req: Request, res: Response): Promise<Response> {
    try {
      const { createdby } = req.query;

      if (!createdby || typeof createdby !== "string") {
        return res.status(400).json({
          error: "Fetch failed",
          message: "createdby parameter is required",
        });
      }

      const campaigns = await campaignService.getCampaignsByUser(createdby);

      return res.status(200).json({
        message: "User campaigns retrieved successfully",
        data: campaigns,
      });
    } catch (error) {
      console.error("Get user campaigns error:", error);
      return res.status(500).json({
        error: "Fetch campaigns failed",
        message: "Internal server error while fetching user campaigns",
      });
    }
  }
}

export default new CampaignController();
