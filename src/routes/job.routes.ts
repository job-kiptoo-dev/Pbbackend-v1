import { Router } from "express";
import jobController from "../controllers/job.controller";
import { authenticate } from "../middleware/auth.middleware";
import { forbidCreators } from "../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job board management operations
 */

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     description: Creates a new job posting (requires authentication)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCreateRequest'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticate, forbidCreators, jobController.createJob);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     description: Retrieves all job postings (public endpoint)
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", jobController.getAllJobs);

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search jobs
 *     description: Search jobs by title or description (public endpoint)
 *     tags: [Jobs]
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
router.get("/search", jobController.searchJobs);

/**
 * @swagger
 * /api/jobs/category/{category}:
 *   get:
 *     summary: Get jobs by category
 *     description: Retrieves jobs filtered by category (public endpoint)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Job category
 *     responses:
 *       200:
 *         description: Category jobs retrieved
 *       400:
 *         description: Missing category parameter
 *       500:
 *         description: Internal server error
 */
router.get("/category/:category", jobController.getJobsByCategory);

/**
 * @swagger
 * /api/jobs/owner/{ownerId}:
 *   get:
 *     summary: Get jobs by owner
 *     description: Get all jobs created by a specific user (public endpoint)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Owner/User ID
 *     responses:
 *       200:
 *         description: Owner jobs retrieved
 *       400:
 *         description: Invalid owner ID
 *       500:
 *         description: Internal server error
 */
router.get("/owner/:ownerId", jobController.getJobsByOwner);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a job by ID
 *     description: Retrieves a specific job with all its details (public endpoint)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       400:
 *         description: Invalid job ID
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", jobController.getJobById);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job
 *     description: Updates job details (requires authentication)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
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
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               payment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Invalid job ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticate, jobController.updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job
 *     description: Deletes a job and all its proposals (requires authentication)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       400:
 *         description: Invalid job ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticate, jobController.deleteJob);

/**
 * @swagger
 * /api/jobs/{id}/proposals:
 *   post:
 *     summary: Create job proposal
 *     description: Creates a new proposal for a job (requires authentication)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposerId
 *               - title
 *             properties:
 *               proposerId:
 *                 type: integer
 *                 description: ID of the proposer
 *               title:
 *                 type: string
 *                 example: "Web Development Proposal"
 *               description:
 *                 type: string
 *                 example: "I can build a responsive website"
 *               proposedBudget:
 *                 type: number
 *                 example: 5000
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Homepage", "About Page", "Contact Form"]
 *     responses:
 *       201:
 *         description: Proposal created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/proposals", authenticate, jobController.createProposal);

/**
 * @swagger
 * /api/jobs/{id}/proposals:
 *   get:
 *     summary: Get job proposals
 *     description: Retrieves all proposals for a job (public endpoint)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
 *       400:
 *         description: Invalid job ID
 *       500:
 *         description: Internal server error
 */
router.get("/:id/proposals", jobController.getJobProposals);

/**
 * @swagger
 * /api/jobs/{id}/proposals/{proposalId}:
 *   put:
 *     summary: Update proposal status
 *     description: Updates the status of a proposal (requires authentication)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["Pending", "Accepted", "Rejected"]
 *                 example: "Accepted"
 *     responses:
 *       200:
 *         description: Proposal status updated successfully
 *       400:
 *         description: Invalid ID or missing status
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/proposals/:proposalId", authenticate, jobController.updateProposalStatus);

/**
 * @swagger
 * /api/jobs/{id}/proposals/{proposalId}:
 *   delete:
 *     summary: Delete proposal
 *     description: Deletes a proposal from a job (requires authentication)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Proposal deleted successfully
 *       400:
 *         description: Invalid proposal ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Proposal not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id/proposals/:proposalId", authenticate, jobController.deleteProposal);

export default router;
