// Collaboration types used around referrals/invites and project collabs

/**
 * Collaboration invite request interface
 * Used for sending invitations to collaborate on campaigns or projects
 */
export interface CollaborationInvite {
  email?: string;
  note?: string;
}

/**
 * Generic collaboration interface with flexible properties
 * Base structure for collaboration objects
 */
export interface Collaboration {
  _id: string;
  [key: string]: any;
}

/**
 * Collaboration role enumeration
 */
export enum CollaborationRole {
  OWNER = "Owner",
  ADMIN = "Admin",
  LEAD = "Lead",
  CONTRIBUTOR = "Contributor",
  VIEWER = "Viewer",
}

/**
 * Collaboration status enumeration
 */
export enum CollaborationStatus {
  PENDING = "Pending",
  ACCEPTED = "Accepted",
  REJECTED = "Rejected",
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

/**
 * Collaboration type enumeration
 */
export enum CollaborationType {
  CAMPAIGN = "Campaign",
  BUSINESS = "Business",
  PROJECT = "Project",
  REFERRAL = "Referral",
}

/**
 * Extended collaboration invite interface with more detailed information
 */
export interface ExtendedCollaborationInvite extends CollaborationInvite {
  inviteeEmail: string;
  inviterId: number;
  collaborationType: CollaborationType;
  entityId: number; // Campaign, Business, or Project ID
  role: CollaborationRole;
  expiresAt?: Date;
  personalMessage?: string;
}

/**
 * Collaboration member interface
 */
export interface CollaborationMember {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: CollaborationRole;
  status: CollaborationStatus;
  joinedAt: Date;
}

/**
 * Collaboration request/response interface for API
 */
export interface CollaborationData {
  id?: number;
  collaborationType: CollaborationType;
  entityId: number;
  inviterId: number;
  inviteeId?: number;
  inviteeEmail?: string;
  role: CollaborationRole;
  status: CollaborationStatus;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
  members?: CollaborationMember[];
}

/**
 * Collaboration acceptance request interface
 */
export interface CollaborationAcceptanceRequest {
  invitationId: number;
  userId: number;
  status: CollaborationStatus;
}
