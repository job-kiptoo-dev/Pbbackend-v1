/**
 * Brand profile types following multi-step form pattern
 */

export type Brand = {
  brandname: string;
  description: string;
  tagline: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  industry: string;
  foundedYear: string;
  employees: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  logo: string;
  coverImage: string;
  mission: string;
  values: string[];
  partnerships: string[];
  awards: string[];
  testimonials: string;
  categories: string[];
  type: "Brand";
};

export type BasicInfoStep = Pick<
  Brand,
  "brandname" | "description" | "tagline" | "website" | "industry"
>;

export type ContactStep = Pick<
  Brand,
  "email" | "phone" | "address" | "city" | "country"
>;

export type CompanyStep = Pick<
  Brand,
  "foundedYear" | "employees" | "mission" | "values"
>;

export type SocialMediaStep = Pick<
  Brand,
  "instagram" | "twitter" | "linkedin" | "facebook" | "youtube" | "tiktok"
>;

export type MediaStep = Pick<
  Brand,
  "logo" | "coverImage"
>;

export type DetailsStep = Pick<
  Brand,
  "partnerships" | "awards" | "testimonials" | "categories"
>;

// Props types for step components
export interface StepProps<T> {
  data: T;
  onUpdate: (data: Partial<T>) => void;
}

export type BasicInfoStepProps = StepProps<BasicInfoStep>;
export type ContactStepProps = StepProps<ContactStep>;
export type CompanyStepProps = StepProps<CompanyStep>;
export type SocialMediaStepProps = StepProps<SocialMediaStep>;
export type MediaStepProps = StepProps<MediaStep>;
export type DetailsStepProps = StepProps<DetailsStep>;

// Initial brand data
export const initialBrandData: Brand = {
  brandname: "",
  description: "",
  tagline: "",
  website: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  industry: "",
  foundedYear: "",
  employees: "",
  instagram: "",
  twitter: "",
  linkedin: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  logo: "",
  coverImage: "",
  mission: "",
  values: [],
  partnerships: [],
  awards: [],
  testimonials: "",
  categories: [],
  type: "Brand",
};
