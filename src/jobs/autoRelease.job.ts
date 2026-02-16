/**
 * Auto-Release Cron Job
 *
 * Runs every 30 minutes to:
 *   1. Auto-release delivered escrows past their inspection deadline
 *   2. Send 24-hour warning notifications to buyers
 *
 * The job is safe to run concurrently (pessimistic locking in the
 * EscrowService prevents duplicate releases).
 *
 * Schedule: "0,30 * * * *" = at minute 0 and 30 of every hour
 */

import cron from "node-cron";
import escrowService from "../services/escrow.service";

/**
 * Start the auto-release cron job.
 * Call this once after the database connection is established.
 */
export function startAutoReleaseJob(): void {
    // Run every 30 minutes
    cron.schedule("0,30 * * * *", async () => {
        console.log("[AutoRelease] Running auto-release check...");

        try {
            await escrowService.processAutoRelease();
            console.log("[AutoRelease] Check completed successfully.");
        } catch (error) {
            // Never let cron job crashes go unnoticed
            console.error("[AutoRelease] Job failed:", error);
        }
    });

    console.log("[AutoRelease] Cron job scheduled (every 30 minutes)");
}
