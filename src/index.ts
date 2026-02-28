import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { setupSwagger } from "./swagger";
import AppDataSource from "./db/data-source";
import authRoutes from "./routes/auth.routes";
import socialVerificationRoutes from "./routes/social-verification.routes";
import campaignRoutes from "./routes/campaign.routes";
import collaborationRoutes from "./routes/collaboration.routes";
import jobRoutes from "./routes/job.routes";
import brandRoutes from "./routes/brand.routes";
import serviceRequestRoutes from "./routes/service-request.routes";
import escrowRoutes from "./routes/escrow.routes";
import { startAutoReleaseJob } from "./jobs/autoRelease.job";
import { paystackWebhookHandler } from "./webhooks/paystack.webhook";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// ─── Phase 2: Paystack Webhook ─────────────────────────────────────
// Must be registered BEFORE express.json() to get raw body
app.post(
  "/webhooks/paystack",
  express.raw({ type: "application/json" }),
  paystackWebhookHandler
);
// ────────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// Routes

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     description: Returns a welcome message with timestamp
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HelloResponse'
 */
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello World! TypeScript Express server is running.",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /*:
 *   get:
 *     summary: 404 - Route not found
 *     description: Handles all undefined routes
 *     tags: [Error Handling]
 *     responses:
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/social-verification", socialVerificationRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/creators-campaign", serviceRequestRoutes);

// ─── Escrow & Notifications (Phase 1) ──────────────────────────────
// These routes use their own /api/... prefixes defined in the router.
app.use(escrowRoutes);

// ─── Phase 2: Paystack Webhook ─────────────────────────────────────
// IMPORTANT: When implementing Phase 2, register the webhook route
// BEFORE express.json() middleware (it needs raw body for signature
// verification). Move this block above the middleware section.
// app.post(
//   '/webhooks/paystack',
//   express.raw({ type: 'application/json' }),
//   paystackWebhookHandler
// );
// ────────────────────────────────────────────────────────────────────

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Start server
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");

    // Start escrow auto-release cron job
    startAutoReleaseJob();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });

export default app;
