import { Router } from "express";
import brandController from "../controllers/brand.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Brand Profiles
 *   description: Brand profile management operations
 */

/**
 * @swagger
 * /api/brands/{businessId}/profile:
 *   get:
 *     summary: Get brand profile
 *     description: Retrieves the brand profile for a business
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Brand profile retrieved
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.get("/:businessId/profile", brandController.getBrandProfile);

/**
 * @swagger
 * /api/brands/{businessId}/profile/basic-info:
 *   put:
 *     summary: Update brand basic info
 *     description: Update brand name, description, tagline, website, industry
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandname:
 *                 type: string
 *               description:
 *                 type: string
 *               tagline:
 *                 type: string
 *               website:
 *                 type: string
 *               industry:
 *                 type: string
 *     responses:
 *       200:
 *         description: Brand basic info updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/basic-info",
  brandController.updateBrandBasicInfo
);

/**
 * @swagger
 * /api/brands/{businessId}/profile/contact:
 *   put:
 *     summary: Update brand contact info
 *     description: Update contact information (email, phone, address, city, country)
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact info updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/contact",
  brandController.updateBrandContact
);

/**
 * @swagger
 * /api/brands/{businessId}/profile/company:
 *   put:
 *     summary: Update brand company info
 *     description: Update company details (founded year, employees, mission, values)
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foundedYear:
 *                 type: string
 *               employees:
 *                 type: string
 *               mission:
 *                 type: string
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Company info updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/company",
  brandController.updateBrandCompany
);

/**
 * @swagger
 * /api/brands/{businessId}/profile/social:
 *   put:
 *     summary: Update brand social media
 *     description: Update social media handles (Instagram, Twitter, LinkedIn, etc.)
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instagram:
 *                 type: string
 *               twitter:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               facebook:
 *                 type: string
 *               youtube:
 *                 type: string
 *               tiktok:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social media updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/social",
  brandController.updateBrandSocial
);

/**
 * @swagger
 * /api/brands/{businessId}/profile/media:
 *   put:
 *     summary: Update brand media
 *     description: Update logo and cover image URLs
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *               coverImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Media updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/media",
  brandController.updateBrandMedia
);

/**
 * @swagger
 * /api/brands/{businessId}/profile/details:
 *   put:
 *     summary: Update brand details
 *     description: Update partnerships, awards, testimonials, categories
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerships:
 *                 type: array
 *                 items:
 *                   type: string
 *               awards:
 *                 type: array
 *                 items:
 *                   type: string
 *               testimonials:
 *                 type: string
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Details updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/details",
  brandController.updateBrandDetails
);

/**
 * @swagger
 * /api/brands/{businessId}/profile/full:
 *   put:
 *     summary: Update entire brand profile
 *     description: Update all brand profile fields in one request
 *     tags: [Brand Profiles]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Brand profile updated
 *       400:
 *         description: Invalid business ID
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:businessId/profile/full",
  brandController.updateBrandProfileFull
);

export default router;
