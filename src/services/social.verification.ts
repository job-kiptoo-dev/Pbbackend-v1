import { google } from "googleapis";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../db/entity/User";
import { SocialVerification } from "../db/entity/SocialVerification";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const youtubeScopes = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
];

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const youtubeInitiateAuth = async (req: Request, res: Response) => {
    try {
        // userId should be set by authenticate middleware
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User identification missing" });
        }

        // Create a secure state token to carry the userId through the OAuth flow
        const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: youtubeScopes,
            state: state
        });
        return res.redirect(url);
    } catch (error) {
        console.error("[YouTubeAuth] Initiation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const youtubeAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({ message: "Authorization code missing" });
        }

        if (!state) {
            return res.status(400).json({ message: "State parameter missing" });
        }

        // Verify the state token and extract userId
        let userId: number;
        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            console.error("[YouTubeAuth] State verification failed:", err);
            return res.status(401).json({ message: "Invalid or expired state session" });
        }

        const { tokens } = await oauth2Client.getToken(code as string);
        oauth2Client.setCredentials(tokens);

        // Get YouTube user info
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelResponse = await youtube.channels.list({
            part: ['snippet', 'contentDetails', 'statistics'],
            mine: true
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            return res.status(400).json({ message: "No YouTube channel found for this account" });
        }

        // Extract channel information
        const channelData = channelResponse.data.items[0];

        if (!channelData || !channelData.snippet) {
            return res.status(400).json({ message: "Invalid YouTube channel data received" });
        }

        // Find the user
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "Local user account not found" });
        }

        // Check if verification record already exists
        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'youtube' }
        });

        // If not, create a new one
        if (!socialVerification) {
            socialVerification = new SocialVerification();
            socialVerification.user = user;
            socialVerification.platform = 'youtube';
        }

        // Update verification data
        socialVerification.isVerified = true;
        socialVerification.verifiedAt = new Date();
        socialVerification.platformData = {
            channelId: channelData.id,
            channelTitle: channelData.snippet?.title || 'Unknown Channel',
            subscriberCount: channelData.statistics?.subscriberCount,
            viewCount: channelData.statistics?.viewCount,
            videoCount: channelData.statistics?.videoCount,
            thumbnails: channelData.snippet?.thumbnails || {},
            url: `https://www.youtube.com/channel/${channelData.id}`
        };

        // Save to database
        await socialVerification.save();

        // Redirect back to frontend with success
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=success&platform=youtube`);
    } catch (error) {
        console.error("[YouTubeAuth] Callback error:", error);
        // Redirect back to frontend with error
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=youtube`);
    }
};
