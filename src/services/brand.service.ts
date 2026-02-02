import { BrandProfile } from "../db/entity/BrandProfile.entity";
import { Business } from "../db/entity/Business.entity";

export class BrandService {
  /**
   * Get or create brand profile for a business
   */
  async getBrandProfile(businessId: number): Promise<BrandProfile | null> {
    const profile = await BrandProfile.findOne({
      where: { business: { id: businessId } },
      relations: ["business"],
    });

    if (!profile) {
      return null;
    }

    return profile;
  }

  /**
   * Create brand profile for a business
   */
  async createBrandProfile(businessId: number): Promise<BrandProfile> {
    const business = await Business.findOne({ where: { id: businessId } });
    if (!business) {
      throw new Error("Business not found");
    }

    const profile = new BrandProfile();
    profile.business = business;

    return await profile.save();
  }

  /**
   * Update brand basic info (name, description, tagline, website, industry)
   */
  async updateBrandBasicInfo(
    businessId: number,
    data: Partial<{ brandname: string; description: string; tagline: string; website: string; industry: string }>
  ): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    if (data.brandname !== undefined) profile.brandname = data.brandname;
    if (data.description !== undefined) profile.description = data.description;
    if (data.tagline !== undefined) profile.tagline = data.tagline;
    if (data.website !== undefined) profile.website = data.website;
    if (data.industry !== undefined) profile.industry = data.industry;

    return await profile.save();
  }

  /**
   * Update brand contact info
   */
  async updateBrandContact(
    businessId: number,
    data: Partial<{ email: string; phone: string; address: string; city: string; country: string }>
  ): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    if (data.email !== undefined) profile.email = data.email;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.address !== undefined) profile.address = data.address;
    if (data.city !== undefined) profile.city = data.city;
    if (data.country !== undefined) profile.country = data.country;

    return await profile.save();
  }

  /**
   * Update brand company info (founded year, employees, mission, values)
   */
  async updateBrandCompany(
    businessId: number,
    data: Partial<{ foundedYear: string; employees: string; mission: string; values: string[] }>
  ): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    if (data.foundedYear !== undefined) profile.foundedYear = data.foundedYear;
    if (data.employees !== undefined) profile.employees = data.employees;
    if (data.mission !== undefined) profile.mission = data.mission;
    if (data.values !== undefined) profile.values = data.values;

    return await profile.save();
  }

  /**
   * Update brand social media
   */
  async updateBrandSocial(
    businessId: number,
    data: Partial<{ instagram: string; twitter: string; linkedin: string; facebook: string; youtube: string; tiktok: string }>
  ): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    if (data.instagram !== undefined) profile.instagram = data.instagram;
    if (data.twitter !== undefined) profile.twitter = data.twitter;
    if (data.linkedin !== undefined) profile.linkedin = data.linkedin;
    if (data.facebook !== undefined) profile.facebook = data.facebook;
    if (data.youtube !== undefined) profile.youtube = data.youtube;
    if (data.tiktok !== undefined) profile.tiktok = data.tiktok;

    return await profile.save();
  }

  /**
   * Update brand media (logo, cover image)
   */
  async updateBrandMedia(
    businessId: number,
    data: Partial<{ logo: string; coverImage: string }>
  ): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    if (data.logo !== undefined) profile.logo = data.logo;
    if (data.coverImage !== undefined) profile.coverImage = data.coverImage;

    return await profile.save();
  }

  /**
   * Update brand details (partnerships, awards, testimonials, categories)
   */
  async updateBrandDetails(
    businessId: number,
    data: Partial<{ partnerships: string[]; awards: string[]; testimonials: string; categories: string[] }>
  ): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    if (data.partnerships !== undefined) profile.partnerships = data.partnerships;
    if (data.awards !== undefined) profile.awards = data.awards;
    if (data.testimonials !== undefined) profile.testimonials = data.testimonials;
    if (data.categories !== undefined) profile.categories = data.categories;

    return await profile.save();
  }

  /**
   * Update entire brand profile in one call
   */
  async updateBrandProfileFull(businessId: number, data: Partial<any>): Promise<BrandProfile> {
    let profile = await this.getBrandProfile(businessId);
    if (!profile) {
      profile = await this.createBrandProfile(businessId);
    }

    const allowedFields = [
      "brandname", "description", "tagline", "website", "industry",
      "email", "phone", "address", "city", "country",
      "foundedYear", "employees", "mission", "values",
      "instagram", "twitter", "linkedin", "facebook", "youtube", "tiktok",
      "logo", "coverImage",
      "partnerships", "awards", "testimonials", "categories",
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        (profile as any)[field] = data[field];
      }
    });

    return await profile.save();
  }
}

export default new BrandService();
