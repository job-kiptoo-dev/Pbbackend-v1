import { ServiceRequest } from "../db/entity/ServiceRequest.entity";
import { User } from "../db/entity/User";
import { Campaign } from "../db/entity/Campaign.entity";

interface CreateServiceRequestDTO {
  serviceType: string;
  description: string;
  skills?: string[];
  tools?: string[];
  budget?: string;
  deliverables?: string;
  deadline?: Date | string;
  tags?: string[];
}

interface UpdateServiceRequestDTO {
  serviceType?: string;
  description?: string;
  skills?: string[];
  tools?: string[];
  budget?: string;
  deliverables?: string;
  deadline?: Date | string;
  tags?: string[];
  status?: "Open" | "In Progress" | "Completed" | "Closed";
}

class ServiceRequestService {
  /**
   * Create new service request
   */
  async createServiceRequest(
    campaignId: number,
    postedById: number,
    data: CreateServiceRequestDTO
  ) {
    const campaign = await Campaign.findOneBy({ id: campaignId });
    if (!campaign) throw new Error("Campaign not found");

    const postedBy = await User.findOneBy({ id: postedById });
    if (!postedBy) throw new Error("User not found");

    const serviceRequest = new ServiceRequest();
    serviceRequest.campaign = campaign;
    serviceRequest.campaign_id = campaignId;
    serviceRequest.postedBy = postedBy;
    serviceRequest.postedBy_id = postedById;
    serviceRequest.serviceType = data.serviceType;
    serviceRequest.description = data.description;
    serviceRequest.skills = data.skills ?? [];
    serviceRequest.tools = data.tools ?? [];
    if (data.budget) serviceRequest.budget = data.budget as any;
    if (data.deliverables) serviceRequest.deliverables = data.deliverables as any;
    if (data.deadline) serviceRequest.deadline = new Date(data.deadline) as any;
    serviceRequest.tags = data.tags ?? [];
    serviceRequest.status = "Open";
    serviceRequest.applications = 0;

    return await serviceRequest.save();
  }

  /**
   * Get requests by campaign
   */
  async getServiceRequestsByCampaign(campaignId: number) {
    return await ServiceRequest.find({
      where: { campaign_id: campaignId },
      order: { createdAt: "DESC" },
      relations: ["campaign", "postedBy"],
    });
  }

  /**
   * Single service request
   */
  async getServiceRequestById(id: number) {
    return await ServiceRequest.findOne({
      where: { id },
      relations: ["campaign", "postedBy"],
    });
  }

  /**
   * Requests posted by a user
   */
  async getServiceRequestsByPostedBy(userId: number) {
    return await ServiceRequest.find({
      where: { postedBy_id: userId },
      order: { createdAt: "DESC" },
      relations: ["campaign", "postedBy"],
    });
  }

  /**
   * Search by serviceType + optional campaignId
   */
  async searchServiceRequests(serviceType: string, campaignId?: number) {
    const query = ServiceRequest.createQueryBuilder("sr")
      .where("LOWER(sr.serviceType) LIKE LOWER(:serviceType)", {
        serviceType: `%${serviceType}%`,
      });

    if (campaignId) {
      query.andWhere("sr.campaign_id = :campaignId", { campaignId });
    }

    return await query
      .orderBy("sr.createdAt", "DESC")
      .getMany();
  }

  /**
   * Update service request
   */
  async updateServiceRequest(id: number, data: UpdateServiceRequestDTO) {
    const serviceRequest = await ServiceRequest.findOneBy({ id });
    if (!serviceRequest) throw new Error("Service request not found");

    const allowedFields: (keyof UpdateServiceRequestDTO)[] = [
      "serviceType",
      "description",
      "skills",
      "tools",
      "budget",
      "deliverables",
      "deadline",
      "tags",
      "status",
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === "deadline") {
          (serviceRequest as any).deadline = data.deadline
            ? new Date(data.deadline)
            : null;
        } else {
          (serviceRequest as any)[key] = data[key];
        }
      }
    }

    return await serviceRequest.save();
  }

  async updateServiceRequestStatus(
    id: number,
    status: "Open" | "In Progress" | "Completed" | "Closed"
  ) {
    return await this.updateServiceRequest(id, { status });
  }

  /**
   * Increment proposals count
   */
  async incrementApplicationCount(id: number) {
    const serviceRequest = await ServiceRequest.findOneBy({ id });
    if (!serviceRequest) throw new Error("Service request not found");

    serviceRequest.applications += 1;
    return await serviceRequest.save();
  }

  /**
   * Delete
   */
  async deleteServiceRequest(id: number) {
    const serviceRequest = await ServiceRequest.findOneBy({ id });
    if (!serviceRequest) throw new Error("Service request not found");

    return await serviceRequest.remove();
  }

  /**
   * Get by tags (simple-array compatible)
   */
  async getServiceRequestsByTags(tags: string[]) {
    if (!tags || tags.length === 0) return [];

    const qb = ServiceRequest.createQueryBuilder("sr");

    tags.forEach((tag, i) => {
      qb.orWhere(`sr.tags LIKE :tag${i}`, { [`tag${i}`]: `%${tag}%` });
    });

    return await qb.orderBy("sr.createdAt", "DESC").getMany();
  }

  /**
   * Open only
   */
  async getOpenServiceRequests() {
    return await ServiceRequest.find({
      where: { status: "Open" },
      order: { createdAt: "DESC" },
      relations: ["campaign", "postedBy"],
    });
  }
}

export default new ServiceRequestService();
