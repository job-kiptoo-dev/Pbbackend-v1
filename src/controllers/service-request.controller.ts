import { Request, Response } from "express";
import serviceRequestService from "../services/service-request.service";
import escrowService from "../services/escrow.service";

class ServiceRequestController {
  /**
   * Create a new service request for a campaign
   */
  async createServiceRequest(req: Request, res: Response) {
    try {
      const { campaignId, serviceType, description, skills, tools, budget, deliverables, deadline, tags } = req.body;
      const userId = (req as any).user?.id;

      if (!campaignId || !serviceType || !description) {
        return res.status(400).json({
          error: "Missing required fields: campaignId, serviceType, description",
        });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const serviceRequest = await serviceRequestService.createServiceRequest(
        campaignId,
        userId,
        {
          serviceType,
          description,
          skills: skills || [],
          tools: tools || [],
          budget,
          deliverables,
          deadline: deadline ? new Date(deadline) : undefined,
          tags: tags || [],
        }
      );

      return res.status(201).json({
        message: "Service request created successfully",
        data: serviceRequest,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to create service request",
      });
    }
  }

  /**
   * Get all service requests for a campaign
   */
  async getServiceRequestsByCampaign(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;

      if (!campaignId) {
        return res.status(400).json({ error: "campaignId is required" });
      }

      const requests = await serviceRequestService.getServiceRequestsByCampaign(
        parseInt(campaignId)
      );

      return res.status(200).json({
        message: "Service requests retrieved",
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to retrieve service requests",
      });
    }
  }

  /**
   * Get a single service request
   */
  async getServiceRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      const request = await serviceRequestService.getServiceRequestById(
        parseInt(id)
      );

      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      return res.status(200).json({
        message: "Service request retrieved",
        data: request,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to retrieve service request",
      });
    }
  }

  /**
   * Get service requests posted by current user
   */
  async getMyServiceRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const requests = await serviceRequestService.getServiceRequestsByPostedBy(
        userId
      );

      return res.status(200).json({
        message: "Your service requests",
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to retrieve service requests",
      });
    }
  }

  /**
   * Search service requests by type
   */
  async searchServiceRequests(req: Request, res: Response) {
    try {
      const { serviceType, campaignId } = req.query;

      if (!serviceType) {
        return res.status(400).json({ error: "serviceType is required" });
      }

      const requests = await serviceRequestService.searchServiceRequests(
        serviceType as string,
        campaignId ? parseInt(campaignId as string) : undefined
      );

      return res.status(200).json({
        message: "Service requests found",
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to search service requests",
      });
    }
  }

  /**
   * Update a service request
   */
  async updateServiceRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      const serviceRequest = await serviceRequestService.getServiceRequestById(
        parseInt(id)
      );

      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Ownership check
      if (serviceRequest.postedBy_id !== userId) {
        return res.status(403).json({
          error: "Only the creator can update this service request",
        });
      }

      const updated = await serviceRequestService.updateServiceRequest(
        parseInt(id),
        req.body
      );

      return res.status(200).json({
        message: "Service request updated",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to update service request",
      });
    }
  }

  /**
   * Update service request status
   */
  async updateServiceRequestStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, creatorId } = req.body;
      const userId = (req as any).user?.id;

      if (!id || !status) {
        return res.status(400).json({
          error: "id and status are required",
        });
      }

      const serviceRequest = await serviceRequestService.getServiceRequestById(
        parseInt(id)
      );

      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Ownership check
      if (serviceRequest.postedBy_id !== userId) {
        return res.status(403).json({
          error: "Only the creator can update this service request status",
        });
      }

      const validStatuses = ["Open", "In Progress", "Completed", "Closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const updated = await serviceRequestService.updateServiceRequestStatus(
        parseInt(id),
        status
      );

      // -- PHASE 1 Integration: Escrow Trigger --
      if (status === "In Progress") {
        try {
          if (creatorId) {
            console.log(`[ServiceRequestController] Service Request ${id} hired, triggering escrow creation...`);
            await escrowService.createFromServiceRequest(parseInt(id), Number(creatorId), userId!);
          } else {
            console.warn(`[ServiceRequestController] Service Request ${id} changed to "In Progress" but no creatorId found. Escrow skipped.`);
          }
        } catch (escrowError) {
          console.error(`[ServiceRequestController] Failed to create escrow for service request ${id}:`, escrowError);
          // Don't fail the update since the status is already updated
        }
      }

      return res.status(200).json({
        message: "Service request status updated",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to update service request status",
      });
    }
  }

  /**
   * Delete a service request
   */
  async deleteServiceRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      const serviceRequest = await serviceRequestService.getServiceRequestById(
        parseInt(id)
      );

      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Ownership check
      if (serviceRequest.postedBy_id !== userId) {
        return res.status(403).json({
          error: "Only the creator can delete this service request",
        });
      }

      await serviceRequestService.deleteServiceRequest(parseInt(id));

      return res.status(200).json({
        message: "Service request deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to delete service request",
      });
    }
  }

  /**
   * Get open service requests
   */
  async getOpenServiceRequests(req: Request, res: Response) {
    try {
      const requests = await serviceRequestService.getOpenServiceRequests();

      return res.status(200).json({
        message: "Open service requests",
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message || "Failed to retrieve open service requests",
      });
    }
  }
}

export default new ServiceRequestController();
