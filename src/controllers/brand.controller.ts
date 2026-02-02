import { Request, Response } from "express";
import brandService from "../services/brand.service";

export class BrandController {
  /**
   * Get brand profile by business ID
   */
  public async getBrandProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      let profile = await brandService.getBrandProfile(id);

      if (!profile) {
        profile = await brandService.createBrandProfile(id);
      }

      return res.status(200).json({
        message: "Brand profile retrieved",
        profile,
      });
    } catch (error) {
      console.error("Get brand profile error:", error);
      return res.status(500).json({
        error: "Failed to retrieve brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update brand basic info
   */
  public async updateBrandBasicInfo(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandBasicInfo(id, req.body);

      return res.status(200).json({
        message: "Brand basic info updated",
        profile,
      });
    } catch (error) {
      console.error("Update brand basic info error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update brand contact info
   */
  public async updateBrandContact(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandContact(id, req.body);

      return res.status(200).json({
        message: "Brand contact info updated",
        profile,
      });
    } catch (error) {
      console.error("Update brand contact error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update brand company info
   */
  public async updateBrandCompany(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandCompany(id, req.body);

      return res.status(200).json({
        message: "Brand company info updated",
        profile,
      });
    } catch (error) {
      console.error("Update brand company error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update brand social media
   */
  public async updateBrandSocial(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandSocial(id, req.body);

      return res.status(200).json({
        message: "Brand social media updated",
        profile,
      });
    } catch (error) {
      console.error("Update brand social error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update brand media
   */
  public async updateBrandMedia(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandMedia(id, req.body);

      return res.status(200).json({
        message: "Brand media updated",
        profile,
      });
    } catch (error) {
      console.error("Update brand media error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update brand details
   */
  public async updateBrandDetails(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandDetails(id, req.body);

      return res.status(200).json({
        message: "Brand details updated",
        profile,
      });
    } catch (error) {
      console.error("Update brand details error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update entire brand profile
   */
  public async updateBrandProfileFull(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const id = Number(businessId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Business ID must be a number",
        });
      }

      const profile = await brandService.updateBrandProfileFull(id, req.body);

      return res.status(200).json({
        message: "Brand profile updated successfully",
        profile,
      });
    } catch (error) {
      console.error("Update brand profile full error:", error);
      return res.status(500).json({
        error: "Failed to update brand profile",
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

export default new BrandController();
