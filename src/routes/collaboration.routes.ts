import { Router } from "express";
import collaborationController from "../controllers/collaboration.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Collaborations
 *   description: Collaboration and invitation management
 */

/**
 * @swagger
 * /api/collaborations/invite:
 *   post:
 *     summary: Create a collaboration invitation
 *     description: Send an invitation to collaborate on a campaign or business
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collaborationType
 *               - entityId
 *               - role
 *             properties:
 *               collaborationType:
 *                 type: string
 *                 enum: [Campaign, Business, Project, Referral]
 *                 example: "Campaign"
 *               entityId:
 *                 type: integer
 *                 example: 1
 *               inviteeEmail:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               inviteeId:
 *                 type: integer
 *                 example: 2
 *               role:
 *                 type: string
 *                 enum: [Owner, Admin, Lead, Contributor, Viewer]
 *                 example: "Contributor"
 *               message:
 *                 type: string
 *                 example: "Join our campaign team!"
 *               expiresIn:
 *                 type: integer
 *                 description: Expiration time in hours
 *                 example: 168
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/invite", authenticate, collaborationController.createInvitation);

/**
 * @swagger
 * /api/collaborations/accept:
 *   post:
 *     summary: Accept a collaboration invitation
 *     description: Accept a pending collaboration invitation
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/accept", authenticate, collaborationController.acceptInvitation);

/**
 * @swagger
 * /api/collaborations/reject:
 *   post:
 *     summary: Reject a collaboration invitation
 *     description: Reject a pending collaboration invitation
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/reject", authenticate, collaborationController.rejectInvitation);

/**
 * @swagger
 * /api/collaborations/my-invitations:
 *   get:
 *     summary: Get all collaboration invitations
 *     description: Retrieve all invitations for the current user
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/my-invitations", authenticate, collaborationController.getMyInvitations);

/**
 * @swagger
 * /api/collaborations/pending:
 *   get:
 *     summary: Get pending collaboration invitations
 *     description: Retrieve all pending invitations for the current user
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending invitations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/pending", authenticate, collaborationController.getPendingInvitations);

/**
 * @swagger
 * /api/collaborations/campaign/{campaignId}:
 *   get:
 *     summary: Get campaign collaborators
 *     description: Retrieve all collaborators for a specific campaign
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Collaborators retrieved successfully
 *       400:
 *         description: Invalid campaign ID
 *       500:
 *         description: Internal server error
 */
router.get("/campaign/:campaignId", collaborationController.getCampaignCollaborators);

/**
 * @swagger
 * /api/collaborations/business/{businessId}:
 *   get:
 *     summary: Get business collaborators
 *     description: Retrieve all collaborators for a specific business
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Collaborators retrieved successfully
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.get("/business/:businessId", collaborationController.getBusinessCollaborators);

/**
 * @swagger
 * /api/collaborations/{collaborationId}/role:
 *   put:
 *     summary: Update collaborator role
 *     description: Update the role of a collaborator
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collaborationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collaboration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Owner, Admin, Lead, Contributor, Viewer]
 *                 example: "Lead"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/:collaborationId/role", authenticate, collaborationController.updateCollaboratorRole);

/**
 * @swagger
 * /api/collaborations/{collaborationId}:
 *   delete:
 *     summary: Remove a collaborator
 *     description: Remove a collaborator from a campaign or business
 *     tags: [Collaborations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collaborationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collaboration ID
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:collaborationId", authenticate, collaborationController.removeCollaborator);

/**
 * @swagger
 * /api/collaborations/verify/{token}:
 *   get:
 *     summary: Verify invitation token
 *     description: Verify a collaboration invitation by token
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation verified successfully
 *       400:
 *         description: Invalid token
 *       404:
 *         description: Invitation not found or expired
 *       500:
 *         description: Internal server error
 */
router.get("/verify/:token", collaborationController.verifyInvitationToken);

export default router;
