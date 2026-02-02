import { Request, Response } from "express";
import collaborationService from "../services/collaboration.service";

export class CollaborationController {
  public async createInvitation(req: Request, res: Response): Promise<Response> {
    try {
      const { collaborationType, entityId, inviteeEmail, inviteeId, role, message, expiresIn } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      if (!collaborationType || !entityId || !role) {
        return res.status(400).json({
          error: "Invalid request",
          message: "collaborationType, entityId, and role are required",
        });
      }

      if (!inviteeEmail && !inviteeId) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Either inviteeEmail or inviteeId is required",
        });
      }

      const collaboration = await collaborationService.createCollaborationInvite({
        collaborationType,
        entityId,
        inviterId: userId,
        inviteeEmail,
        inviteeId,
        role,
        message,
        expiresIn,
      });

      return res.status(201).json({
        message: "Collaboration invitation created successfully",
        data: collaboration,
      });
    } catch (error: any) {
      console.error("Create invitation error:", error);
      return res.status(500).json({
        error: "Invitation creation failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async acceptInvitation(req: Request, res: Response): Promise<Response> {
    try {
      const { invitationId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      if (!invitationId) {
        return res.status(400).json({
          error: "Invalid request",
          message: "invitationId is required",
        });
      }

      const collaboration = await collaborationService.acceptCollaborationInvite(
        invitationId,
        userId
      );

      return res.status(200).json({
        message: "Collaboration invitation accepted successfully",
        data: collaboration,
      });
    } catch (error: any) {
      console.error("Accept invitation error:", error);
      return res.status(500).json({
        error: "Invitation acceptance failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async rejectInvitation(req: Request, res: Response): Promise<Response> {
    try {
      const { invitationId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      if (!invitationId) {
        return res.status(400).json({
          error: "Invalid request",
          message: "invitationId is required",
        });
      }

      const collaboration = await collaborationService.rejectCollaborationInvite(
        invitationId,
        userId
      );

      return res.status(200).json({
        message: "Collaboration invitation rejected successfully",
        data: collaboration,
      });
    } catch (error: any) {
      console.error("Reject invitation error:", error);
      return res.status(500).json({
        error: "Invitation rejection failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async getMyInvitations(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      const invitations = await collaborationService.getCollaborationInvites(userId);

      return res.status(200).json({
        message: "Invitations retrieved successfully",
        data: invitations,
      });
    } catch (error: any) {
      console.error("Get invitations error:", error);
      return res.status(500).json({
        error: "Fetch invitations failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async getPendingInvitations(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      const pendingInvitations = await collaborationService.getPendingInvitations(userId);

      return res.status(200).json({
        message: "Pending invitations retrieved successfully",
        data: pendingInvitations,
      });
    } catch (error: any) {
      console.error("Get pending invitations error:", error);
      return res.status(500).json({
        error: "Fetch pending invitations failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async getCampaignCollaborators(req: Request, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const cId = Number(campaignId);

      if (isNaN(cId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Campaign ID must be a number",
        });
      }

      const collaborators = await collaborationService.getCampaignCollaborators(cId);

      return res.status(200).json({
        message: "Campaign collaborators retrieved successfully",
        data: collaborators,
      });
    } catch (error: any) {
      console.error("Get campaign collaborators error:", error);
      return res.status(500).json({
        error: "Fetch collaborators failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async getBusinessCollaborators(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const bId = Number(businessId);

      if (isNaN(bId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const collaborators = await collaborationService.getBusinessCollaborators(bId);

      return res.status(200).json({
        message: "Business collaborators retrieved successfully",
        data: collaborators,
      });
    } catch (error: any) {
      console.error("Get business collaborators error:", error);
      return res.status(500).json({
        error: "Fetch collaborators failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async updateCollaboratorRole(req: Request, res: Response): Promise<Response> {
    try {
      const { collaborationId } = req.params;
      const { role } = req.body;
      const userId = (req as any).user?.id;
      const cId = Number(collaborationId);

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      if (isNaN(cId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Collaboration ID must be a number",
        });
      }

      if (!role) {
        return res.status(400).json({
          error: "Invalid request",
          message: "role is required",
        });
      }

      const collaboration = await collaborationService.updateCollaboratorRole(cId, role, userId);

      return res.status(200).json({
        message: "Collaborator role updated successfully",
        data: collaboration,
      });
    } catch (error: any) {
      console.error("Update collaborator role error:", error);
      return res.status(500).json({
        error: "Role update failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async removeCollaborator(req: Request, res: Response): Promise<Response> {
    try {
      const { collaborationId } = req.params;
      const userId = (req as any).user?.id;
      const cId = Number(collaborationId);

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID is required",
        });
      }

      if (isNaN(cId)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Collaboration ID must be a number",
        });
      }

      await collaborationService.removeCollaborator(cId, userId);

      return res.status(200).json({
        message: "Collaborator removed successfully",
      });
    } catch (error: any) {
      console.error("Remove collaborator error:", error);
      return res.status(500).json({
        error: "Collaborator removal failed",
        message: error.message || "Internal server error",
      });
    }
  }

  public async verifyInvitationToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Invitation token is required",
        });
      }

      const collaboration = await collaborationService.verifyInvitationToken(token);

      if (!collaboration) {
        return res.status(404).json({
          error: "Invalid or expired invitation",
          message: "The invitation token is invalid or has expired",
        });
      }

      return res.status(200).json({
        message: "Invitation verified successfully",
        data: collaboration,
      });
    } catch (error: any) {
      console.error("Verify invitation token error:", error);
      return res.status(500).json({
        error: "Token verification failed",
        message: error.message || "Internal server error",
      });
    }
  }
}

export default new CollaborationController();
