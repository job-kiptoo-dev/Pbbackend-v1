/**
 * Creator profile types following multi-step form pattern
 */

export type Creator = {
  creatorname: string;
  about: string;
  experience: string;
  main: string;
  followers: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  youtube: string;
  linkedin: string;
  facebook: string;
  milestones: string;
  social: string;
  category: string;
  subCategory: string[];
  corevalue: string;
  coreValues: string[];
  subCoreValues: string[];
  topics: string[];
  collabs: string[];
  preview: string;
  avatar: string;
  type: "Creator";
};

export type BasicInfoStep = Pick<
  Creator,
  "creatorname" | "about" | "main"
>;

export type SocialMediaStep = Pick<
  Creator,
  "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "facebook" | "followers" | "social"
>;

export type ExperienceStep = Pick<
  Creator,
  "experience" | "milestones" | "collabs"
>;

export type CategoriesValuesStep = Pick<
  Creator,
  "category" | "subCategory" | "corevalue" | "coreValues" | "subCoreValues" | "topics"
>;

export type ProfileMediaStep = Pick<
  Creator,
  "avatar" | "preview"
>;

// Props types for step components
export interface StepProps<T> {
  data: T;
  onUpdate: (data: Partial<T>) => void;
}

export type BasicInfoStepProps = StepProps<BasicInfoStep>;
export type SocialMediaStepProps = StepProps<SocialMediaStep>;
export type ExperienceStepProps = StepProps<ExperienceStep>;
export type CategoriesValuesStepProps = StepProps<CategoriesValuesStep>;
export type ProfileMediaStepProps = StepProps<ProfileMediaStep>;

// Initial creator data
export const initialCreatorData: Creator = {
  creatorname: "",
  about: "",
  experience: "",
  main: "",
  followers: "",
  instagram: "",
  tiktok: "",
  twitter: "",
  youtube: "",
  linkedin: "",
  facebook: "",
  milestones: "",
  social: "",
  category: "",
  subCategory: [],
  corevalue: "",
  coreValues: [],
  subCoreValues: [],
  topics: [],
  collabs: [],
  preview: "",
  avatar: "",
  type: "Creator",
};
