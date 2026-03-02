import { google } from "googleapis";
import { Request, Response } from "express";
import axios from "axios";
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

// Meta (Facebook/Instagram) constants
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URL = process.env.META_REDIRECT_URL;


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

// ============================================================
// Facebook Verification
// ============================================================

export const facebookInitiateAuth = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User identification missing" });
        }

        const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

        const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${META_REDIRECT_URL}&state=${state}&scope=public_profile,email`;

        return res.redirect(url);
    } catch (error) {
        console.error("[FacebookAuth] Initiation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const facebookAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({ message: "Authorization code missing" });
        }

        let userId: number;
        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired state session" });
        }

        // Exchange code for access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                redirect_uri: META_REDIRECT_URL,
                code: code
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Get user profile
        const profileResponse = await axios.get(`https://graph.facebook.com/me`, {
            params: {
                fields: 'id,name,email',
                access_token: accessToken
            }
        });

        const profileData = profileResponse.data;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'facebook' }
        });

        if (!socialVerification) {
            socialVerification = new SocialVerification();
            socialVerification.user = user;
            socialVerification.platform = 'facebook';
        }

        socialVerification.isVerified = true;
        socialVerification.verifiedAt = new Date();
        socialVerification.platformData = {
            facebookId: profileData.id,
            name: profileData.name,
            email: profileData.email,
            url: `https://www.facebook.com/${profileData.id}`
        };

        await socialVerification.save();

        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=success&platform=facebook`);
    } catch (error: any) {
        console.error("[FacebookAuth] Callback error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=facebook`);
    }
};

// ============================================================
// Instagram Verification (Requires Business Account linked to a FB Page)
// ============================================================

export const instagramInitiateAuth = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User identification missing" });
        }

        const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

        // Scopes needed for Instagram Graph API access via Facebook Login
        const scopes = [
            'instagram_basic',
            'pages_show_list',
            'pages_read_engagement'
        ].join(',');

        const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${META_REDIRECT_URL}&state=${state}&scope=${scopes}`;

        return res.redirect(url);
    } catch (error) {
        console.error("[InstagramAuth] Initiation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const instagramAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        let userId: number;
        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired state session" });
        }

        // 1. Exchange code for access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                redirect_uri: META_REDIRECT_URL,
                code: code
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // 2. Get managed pages to find linked Instagram accounts
        const pagesResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
            params: { access_token: accessToken }
        });

        const pages = pagesResponse.data.data;
        if (!pages || pages.length === 0) {
            return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=instagram&reason=no_pages`);
        }

        // 3. Find the first page with a linked Instagram Business Account
        let instagramAccount = null;

        for (const page of pages) {
            try {
                const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
                    params: {
                        fields: 'instagram_business_account',
                        access_token: accessToken
                    }
                });

                if (igResponse.data.instagram_business_account) {
                    const igId = igResponse.data.instagram_business_account.id;

                    // 4. Fetch Instagram account details
                    const igDataResponse = await axios.get(`https://graph.facebook.com/v18.0/${igId}`, {
                        params: {
                            fields: 'username,name,follower_count,media_count,profile_picture_url',
                            access_token: accessToken
                        }
                    });

                    instagramAccount = igDataResponse.data;
                    break;
                }
            } catch (pageError) {
                console.warn(`[InstagramAuth] Error checking page ${page.id}:`, pageError);
                continue;
            }
        }

        if (!instagramAccount) {
            return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=instagram&reason=no_instagram_account`);
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'instagram' }
        });

        if (!socialVerification) {
            socialVerification = new SocialVerification();
            socialVerification.user = user;
            socialVerification.platform = 'instagram';
        }

        socialVerification.isVerified = true;
        socialVerification.verifiedAt = new Date();
        socialVerification.platformData = {
            instagramId: instagramAccount.id,
            username: instagramAccount.username,
            name: instagramAccount.name,
            followerCount: instagramAccount.follower_count,
            mediaCount: instagramAccount.media_count,
            profilePictureUrl: instagramAccount.profile_picture_url,
            url: `https://www.instagram.com/${instagramAccount.username}`
        };

        await socialVerification.save();

        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=success&platform=instagram`);
    } catch (error: any) {
        console.error("[InstagramAuth] Callback error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=instagram`);
    }
};
