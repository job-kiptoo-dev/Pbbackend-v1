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

// TikTok constants
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

// X (Twitter) constants
const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const X_REDIRECT_URI = process.env.X_REDIRECT_URI;

// LinkedIn constants
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;


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

// ============================================================
// TikTok Verification
// ============================================================

export const tiktokInitiateAuth = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User identification missing" });
        }

        const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

        const url = `https://www.tiktok.com/v2/auth/authorize/` +
            `?client_key=${TIKTOK_CLIENT_KEY}` +
            `&scope=user.info.basic` +
            `&response_type=code` +
            `&redirect_uri=${TIKTOK_REDIRECT_URI}` +
            `&state=${state}`;

        return res.redirect(url);
    } catch (error) {
        console.error("[TikTokAuth] Initiation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const tiktokAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        let userId: number;
        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired state session" });
        }

        const tokenResponse = await axios.post(`https://open-api.tiktok.com/oauth/access_token/`, null, {
            params: {
                client_key: TIKTOK_CLIENT_KEY,
                client_secret: TIKTOK_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code'
            }
        });

        const accessToken = tokenResponse.data.data.access_token;
        const openId = tokenResponse.data.data.open_id;

        const profileResponse = await axios.post(`https://open-api.tiktok.com/user/info/`, {
            access_token: accessToken,
            open_id: openId,
            fields: ["open_id", "union_id", "avatar_url", "display_name"]
        });

        const profileData = profileResponse.data.data.user;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'tiktok' }
        });

        if (!socialVerification) {
            socialVerification = new SocialVerification();
            socialVerification.user = user;
            socialVerification.platform = 'tiktok';
        }

        socialVerification.isVerified = true;
        socialVerification.verifiedAt = new Date();
        socialVerification.platformData = {
            openId: profileData.open_id,
            displayName: profileData.display_name,
            avatarUrl: profileData.avatar_url,
            url: `https://www.tiktok.com/@${profileData.display_name}`
        };

        await socialVerification.save();

        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=success&platform=tiktok`);
    } catch (error: any) {
        console.error("[TikTokAuth] Callback error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=tiktok`);
    }
};

// ============================================================
// X (Twitter) Verification
// ============================================================

export const xInitiateAuth = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User identification missing" });
        }

        const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

        // Using OAuth 2.0 with PKCE is standard for X
        // For now, we use a simple placeholder flow
        const url = `https://twitter.com/i/oauth2/authorize` +
            `?response_type=code` +
            `&client_id=${X_CLIENT_ID}` +
            `&redirect_uri=${X_REDIRECT_URI}` +
            `&scope=tweet.read%20users.read%20follows.read` +
            `&state=${state}` +
            `&code_challenge=challenge&code_challenge_method=plain`; // Placeholder PKCE

        return res.redirect(url);
    } catch (error) {
        console.error("[XAuth] Initiation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const xAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        let userId: number;
        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired state session" });
        }

        const authHeader = Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64');

        const tokenResponse = await axios.post(`https://api.twitter.com/2/oauth2/token`,
            new URLSearchParams({
                code: code as string,
                grant_type: 'authorization_code',
                redirect_uri: X_REDIRECT_URI as string,
                code_verifier: 'challenge'
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        const userResponse = await axios.get(`https://api.twitter.com/2/users/me`, {
            params: { 'user.fields': 'public_metrics,profile_image_url,description' },
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const profileData = userResponse.data.data;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'x' }
        });

        if (!socialVerification) {
            socialVerification = new SocialVerification();
            socialVerification.user = user;
            socialVerification.platform = 'x';
        }

        socialVerification.isVerified = true;
        socialVerification.verifiedAt = new Date();
        socialVerification.platformData = {
            xId: profileData.id,
            username: profileData.username,
            name: profileData.name,
            followerCount: profileData.public_metrics?.followers_count,
            followingCount: profileData.public_metrics?.following_count,
            tweetCount: profileData.public_metrics?.tweet_count,
            profileImageUrl: profileData.profile_image_url,
            url: `https://x.com/${profileData.username}`
        };

        await socialVerification.save();

        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=success&platform=x`);
    } catch (error: any) {
        console.error("[XAuth] Callback error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=x`);
    }
};

// ============================================================
// LinkedIn Verification
// ============================================================

export const linkedinInitiateAuth = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User identification missing" });
        }

        const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });

        const url = `https://www.linkedin.com/oauth/v2/authorization` +
            `?response_type=code` +
            `&client_id=${LINKEDIN_CLIENT_ID}` +
            `&redirect_uri=${LINKEDIN_REDIRECT_URI}` +
            `&state=${state}` +
            `&scope=openid%20profile%20email`;

        return res.redirect(url);
    } catch (error) {
        console.error("[LinkedInAuth] Initiation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const linkedinAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        let userId: number;
        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired state session" });
        }

        const tokenResponse = await axios.post(`https://www.linkedin.com/oauth/v2/accessToken`,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: LINKEDIN_REDIRECT_URI as string,
                client_id: LINKEDIN_CLIENT_ID as string,
                client_secret: LINKEDIN_CLIENT_SECRET as string
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;

        const profileResponse = await axios.get(`https://api.linkedin.com/v2/userinfo`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const profileData = profileResponse.data;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'linkedin' }
        });

        if (!socialVerification) {
            socialVerification = new SocialVerification();
            socialVerification.user = user;
            socialVerification.platform = 'linkedin';
        }

        socialVerification.isVerified = true;
        socialVerification.verifiedAt = new Date();
        socialVerification.platformData = {
            linkedinId: profileData.sub,
            name: profileData.name,
            givenName: profileData.given_name,
            familyName: profileData.family_name,
            email: profileData.email,
            picture: profileData.picture,
            url: `https://www.linkedin.com/in/${profileData.sub}` // Placeholder URL
        };

        await socialVerification.save();

        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=success&platform=linkedin`);
    } catch (error: any) {
        console.error("[LinkedInAuth] Callback error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/profile/settings?verification=error&platform=linkedin`);
    }
};
