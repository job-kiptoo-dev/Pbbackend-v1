import { Router } from "express";
import campaignController from "../controllers/campaign.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign management operations
 */

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     description: Creates a new campaign with basic information
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Summer Product Launch"
 *               description:
 *                 type: string
 *                 example: "Campaign to launch our new summer product line"
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Reach 100k users", "Increase sales by 50%"]
 *               budget:
 *                 type: number
 *                 example: 50000
 *               createdby:
 *                 type: string
 *                 example: "john@example.com"
 *               cocampaign:
 *                 type: string
 *                 example: "campaign-partner-id"
 *               jobId:
 *                 type: string
 *                 example: "job-123"
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/create", authenticate, campaignController.createCampaign);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     description: Retrieves all campaigns
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", campaignController.getAllCampaigns);

/**
 * @swagger
 * /api/campaigns/search:
 *   get:
 *     summary: Search campaigns
 *     description: Search campaigns by title or description
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 *       500:
 *         description: Internal server error
 */
router.get("/search", campaignController.searchCampaigns);

/**
 * @swagger
 * /api/campaigns/user:
 *   get:
 *     summary: Get campaigns by user
 *     description: Get all campaigns created by a specific user
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: createdby
 *         required: true
 *         schema:
 *           type: string
 *         description: User email or ID
 *     responses:
 *       200:
 *         description: User campaigns retrieved
 *       400:
 *         description: Missing createdby parameter
 *       500:
 *         description: Internal server error
 */
router.get("/user", campaignController.getCampaignsByUser);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get a campaign by ID
 *     description: Retrieves a specific campaign with all its details
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", campaignController.getCampaignById);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   put:
 *     summary: Update a campaign
 *     description: Updates campaign details
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               budget:
 *                 type: number
 *               active:
 *                 type: boolean
 *               cocampaign:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticate, campaignController.updateCampaign);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign
 *     description: Deletes a campaign and all its related data
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticate, campaignController.deleteCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/milestones:
 *   post:
 *     summary: Add milestone to campaign
 *     description: Creates a new milestone for a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Q1 Launch"
 *               description:
 *                 type: string
 *                 example: "Complete first quarter launch"
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 enum: ["Major Milestone", "Minor Milestone"]
 *               start:
 *                 type: string
 *                 format: date
 *               end:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: ["In Progress", "Completed"]
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Milestone added successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/milestones", authenticate, campaignController.addMilestone);

/**
 * @swagger
 * /api/campaigns/{id}/milestones/{milestoneId}:
 *   put:
 *     summary: Update milestone
 *     description: Updates a milestone in a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Milestone ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ["In Progress", "Completed"]
 *     responses:
 *       200:
 *         description: Milestone updated successfully
 *       404:
 *         description: Milestone not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/milestones/:milestoneId", authenticate, campaignController.updateMilestone);

/**
 * @swagger
 * /api/campaigns/{id}/milestones/{milestoneId}:
 *   delete:
 *     summary: Delete milestone
 *     description: Deletes a milestone from a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Milestone ID
 *     responses:
 *       200:
 *         description: Milestone deleted successfully
 *       404:
 *         description: Milestone not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id/milestones/:milestoneId", authenticate, campaignController.deleteMilestone);

/**
 * @swagger
 * /api/campaigns/{id}/teams:
 *   post:
 *     summary: Add team to campaign
 *     description: Creates a new team for a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Marketing Team"
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *     responses:
 *       201:
 *         description: Team added successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/teams", authenticate, campaignController.addTeam);

/**
 * @swagger
 * /api/campaigns/{id}/teams/{teamId}:
 *   delete:
 *     summary: Delete team
 *     description: Deletes a team from a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id/teams/:teamId", authenticate, campaignController.deleteTeam);

/**
 * @swagger
 * /api/campaigns/{id}/feedback:
 *   post:
 *     summary: Add feedback to campaign
 *     description: Adds feedback to a campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               feedback:
 *                 type: string
 *               desc:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback added successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/feedback", campaignController.addFeedback);

/**
 * @swagger
 * /api/campaigns/{id}/feedback:
 *   get:
 *     summary: Get campaign feedback
 *     description: Retrieves all feedback for a campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/:id/feedback", campaignController.getCampaignFeedback);

/**
 * @swagger
 * /api/campaigns/{id}/feedback/{feedbackId}:
 *   delete:
 *     summary: Delete feedback
 *     description: Deletes feedback from a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id/feedback/:feedbackId", authenticate, campaignController.deleteFeedback);

export default router;
