import { Router } from "express";
import serviceRequestController from "../controllers/service-request.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Service Requests
 *   description: Creator campaign service request operations
 */

/**
 * @swagger
 * /api/service-requests:
 *   post:
 *     summary: Create a new service request
 *     description: Creator posts a service request within their campaign (e.g., need a videographer)
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - serviceType
 *               - description
 *             properties:
 *               campaignId:
 *                 type: integer
 *               serviceType:
 *                 type: string
 *                 example: "Videographer"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service request created
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticate,
  (req, res) => serviceRequestController.createServiceRequest(req, res)
);

/**
 * @swagger
 * /api/service-requests/open:
 *   get:
 *     summary: Get all open service requests
 *     description: Retrieve all active service requests available for applications
 *     tags: [Service Requests]
 *     responses:
 *       200:
 *         description: Open service requests retrieved
 */
router.get(
  "/open",
  (req, res) => serviceRequestController.getOpenServiceRequests(req, res)
);

/**
 * @swagger
 * /api/service-requests/search:
 *   get:
 *     summary: Search service requests
 *     description: Search service requests by serviceType and optional campaignId
 *     tags: [Service Requests]
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: campaignId
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service requests found
 */
router.get("/search", (req, res) => serviceRequestController.searchServiceRequests(req, res));

/**
 * @swagger
 * /api/service-requests/campaign/{campaignId}:
 *   get:
 *     summary: Get service requests by campaign
 *     description: Get all service requests for a specific campaign
 *     tags: [Service Requests]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaign service requests
 */
router.get(
  "/campaign/:campaignId",
  (req, res) => serviceRequestController.getServiceRequestsByCampaign(req, res)
);

// Additional endpoints supported by the controller
router.get("/my", authenticate, (req, res) => serviceRequestController.getMyServiceRequests(req, res));
router.get("/search", (req, res) => serviceRequestController.searchServiceRequests(req, res));
router.get("/:id", (req, res) => serviceRequestController.getServiceRequest(req, res));
router.put("/:id", authenticate, (req, res) => serviceRequestController.updateServiceRequest(req, res));
router.patch("/:id/status", authenticate, (req, res) => serviceRequestController.updateServiceRequestStatus(req, res));
router.delete("/:id", authenticate, (req, res) => serviceRequestController.deleteServiceRequest(req, res));
// Search service requests (query: serviceType, optional campaignId)
router.get("/search", (req, res) => serviceRequestController.searchServiceRequests(req, res));

// Get service requests posted by authenticated user
/**
 * @swagger
 * /api/service-requests/my/me:
 *   get:
 *     summary: Get current user's service requests
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your service requests
 */
router.get("/my/me", authenticate, (req, res) => serviceRequestController.getMyServiceRequests(req, res));

// Get a single service request
/**
 * @swagger
 * /api/service-requests/{id}:
 *   get:
 *     summary: Get a single service request
 *     tags: [Service Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service request retrieved
 */
router.get("/:id", (req, res) => serviceRequestController.getServiceRequest(req, res));

// Update a service request (owner only)
/**
 * @swagger
 * /api/service-requests/{id}:
 *   put:
 *     summary: Update a service request
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Service request updated
 */
router.put("/:id", authenticate, (req, res) => serviceRequestController.updateServiceRequest(req, res));

// Update status (owner only)
/**
 * @swagger
 * /api/service-requests/{id}/status:
 *   put:
 *     summary: Update service request status
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 enum: [Open, In Progress, Completed, Closed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/:id/status", authenticate, (req, res) => serviceRequestController.updateServiceRequestStatus(req, res));

// Delete a service request (owner only)
/**
 * @swagger
 * /api/service-requests/{id}:
 *   delete:
 *     summary: Delete a service request
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete("/:id", authenticate, (req, res) => serviceRequestController.deleteServiceRequest(req, res));

export default router;
