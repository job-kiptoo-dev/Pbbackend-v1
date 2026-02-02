import { CollaborationEntity } from "../db/entity/Collaboration.entity";
import { User } from "../db/entity/User";
import { Campaign } from "../db/entity/Campaign.entity";
import { Business } from "../db/entity/Business.entity";
import { CollaborationStatus, CollaborationType, CollaborationRole } from "../types/collaboration.types";
import { v4 as uuidv4 } from "uuid";

/**
 * Collaboration Service
 * Handles all collaboration-related business logic including invitations,
 * role management, and collaboration lifecycle
 */
export class CollaborationService {
  /**
   * Create a collaboration invitation
   */
  async createCollaborationInvite(data: {
    collaborationType: CollaborationType;
    entityId: number;
    inviterId: number;
    inviteeEmail?: string;
    inviteeId?: number;
    role: CollaborationRole;
    message?: string;
    expiresIn?: number; // hours
  }): Promise<CollaborationEntity> {
    // Verify inviter exists
    const inviter = await User.findOne({ where: { id: data.inviterId } });
    if (!inviter) {
      throw new Error("Inviter not found");
    }

    // Verify entity exists based on type
    if (data.collaborationType === CollaborationType.CAMPAIGN) {
      const campaign = await Campaign.findOne({ where: { id: data.entityId } });
      if (!campaign) {
        throw new Error("Campaign not found");
      }
    } else if (data.collaborationType === CollaborationType.BUSINESS) {
      const business = await Business.findOne({ where: { id: data.entityId } });
      if (!business) {
        throw new Error("Business not found");
      }
    }

    // Generate invitation token
    const invitationToken = uuidv4();

    // Calculate expiration date
    const expiresAt = data.expiresIn
      ? new Date(Date.now() + data.expiresIn * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    let invitee: User | null = null;
    let inviteeEmail = data.inviteeEmail;

    // If invitee ID is provided, verify and get their email
    if (data.inviteeId) {
      invitee = await User.findOne({ where: { id: data.inviteeId } });
      if (!invitee) {
        throw new Error("Invitee user not found");
      }
      inviteeEmail = invitee.email;
    }

    if (!inviteeEmail) {
      throw new Error("Either inviteeEmail or inviteeId must be provided");
    }

    // Create collaboration record
    const collaboration = CollaborationEntity.create({
      collaborationType: data.collaborationType,
      campaign: data.collaborationType === CollaborationType.CAMPAIGN ? { id: data.entityId } : null,
      business: data.collaborationType === CollaborationType.BUSINESS ? { id: data.entityId } : null,
      inviter,
      invitee,
      inviteeEmail,
      role: data.role,
      status: CollaborationStatus.PENDING,
      message: data.message,
      expiresAt,
      invitationToken,
    });

    return await collaboration.save();
  }

  /**
   * Accept a collaboration invitation
   */
  async acceptCollaborationInvite(
    invitationId: number,
    userId: number
  ): Promise<CollaborationEntity> {
    const collaboration = await CollaborationEntity.findOne({
      where: { id: invitationId },
      relations: ["invitee"],
    });

    if (!collaboration) {
      throw new Error("Collaboration invitation not found");
    }

    // Verify the user accepting is the invitee
    if (collaboration.invitee?.id !== userId && collaboration.inviteeEmail) {
      const user = await User.findOne({ where: { id: userId } });
      if (!user || user.email !== collaboration.inviteeEmail) {
        throw new Error("Unauthorized to accept this invitation");
      }
    }

    // Check if invitation has expired
    if (collaboration.expiresAt && new Date() > collaboration.expiresAt) {
      throw new Error("Invitation has expired");
    }

    collaboration.status = CollaborationStatus.ACCEPTED;
    collaboration.invitee = await User.findOne({ where: { id: userId } });
    collaboration.acceptedAt = new Date();

    return await collaboration.save();
  }

  /**
   * Reject a collaboration invitation
   */
  async rejectCollaborationInvite(
    invitationId: number,
    userId: number
  ): Promise<CollaborationEntity> {
    const collaboration = await CollaborationEntity.findOne({
      where: { id: invitationId },
      relations: ["invitee"],
    });

    if (!collaboration) {
      throw new Error("Collaboration invitation not found");
    }

    // Verify authorization
    if (collaboration.invitee?.id !== userId && collaboration.inviteeEmail) {
      const user = await User.findOne({ where: { id: userId } });
      if (!user || user.email !== collaboration.inviteeEmail) {
        throw new Error("Unauthorized to reject this invitation");
      }
    }

    collaboration.status = CollaborationStatus.REJECTED;
    return await collaboration.save();
  }

  /**
   * Get all collaboration invitations for a user
   */
  async getCollaborationInvites(userId: number): Promise<CollaborationEntity[]> {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    return await CollaborationEntity.find({
      where: [
        { invitee: { id: userId } },
        { inviteeEmail: user.email },
      ],
      relations: ["inviter", "campaign", "business"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get all collaborators for a campaign
   */
  async getCampaignCollaborators(campaignId: number): Promise<CollaborationEntity[]> {
    return await CollaborationEntity.find({
      where: {
        campaign: { id: campaignId },
        status: CollaborationStatus.ACCEPTED,
      },
      relations: ["invitee", "inviter"],
    });
  }

  /**
   * Get all collaborators for a business
   */
  async getBusinessCollaborators(businessId: number): Promise<CollaborationEntity[]> {
    return await CollaborationEntity.find({
      where: {
        business: { id: businessId },
        status: CollaborationStatus.ACCEPTED,
      },
      relations: ["invitee", "inviter"],
    });
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    collaborationId: number,
    newRole: CollaborationRole,
    requesterId: number
  ): Promise<CollaborationEntity> {
    const collaboration = await CollaborationEntity.findOne({
      where: { id: collaborationId },
      relations: ["inviter", "campaign", "business"],
    });

    if (!collaboration) {
      throw new Error("Collaboration not found");
    }

    // Only the inviter or an admin can change roles
    if (collaboration.inviter.id !== requesterId) {
      throw new Error("Unauthorized to update collaborator role");
    }

    collaboration.role = newRole;
    return await collaboration.save();
  }

  /**
   * Remove a collaborator
   */
  async removeCollaborator(
    collaborationId: number,
    requesterId: number
  ): Promise<boolean> {
    const collaboration = await CollaborationEntity.findOne({
      where: { id: collaborationId },
      relations: ["inviter"],
    });

    if (!collaboration) {
      throw new Error("Collaboration not found");
    }

    // Only the inviter can remove
    if (collaboration.inviter.id !== requesterId) {
      throw new Error("Unauthorized to remove collaborator");
    }

    await collaboration.remove();
    return true;
  }

  /**
   * Check if user is collaborator on campaign
   */
  async isUserCampaignCollaborator(
    userId: number,
    campaignId: number
  ): Promise<boolean> {
    const collaboration = await CollaborationEntity.findOne({
      where: {
        campaign: { id: campaignId },
        invitee: { id: userId },
        status: CollaborationStatus.ACCEPTED,
      },
    });

    return !!collaboration;
  }

  /**
   * Check if user is collaborator on business
   */
  async isUserBusinessCollaborator(
    userId: number,
    businessId: number
  ): Promise<boolean> {
    const collaboration = await CollaborationEntity.findOne({
      where: {
        business: { id: businessId },
        invitee: { id: userId },
        status: CollaborationStatus.ACCEPTED,
      },
    });

    return !!collaboration;
  }

  /**
   * Get pending invitations for a user
   */
  async getPendingInvitations(userId: number): Promise<CollaborationEntity[]> {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    return await CollaborationEntity.find({
      where: [
        {
          invitee: { id: userId },
          status: CollaborationStatus.PENDING,
        },
        {
          inviteeEmail: user.email,
          status: CollaborationStatus.PENDING,
        },
      ],
      relations: ["inviter", "campaign", "business"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Verify collaboration invitation by token
   */
  async verifyInvitationToken(token: string): Promise<CollaborationEntity | null> {
    const collaboration = await CollaborationEntity.findOne({
      where: { invitationToken: token },
      relations: ["inviter", "campaign", "business"],
    });

    if (!collaboration) {
      return null;
    }

    // Check if expired
    if (collaboration.expiresAt && new Date() > collaboration.expiresAt) {
      return null;
    }

    return collaboration;
  }
}

export default new CollaborationService();
