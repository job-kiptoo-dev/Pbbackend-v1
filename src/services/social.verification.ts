import { google } from "googleapis";
import { Request, Response } from "express";
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
]

export const youtubeInitiateAuth = async (req:Request,res:Response) => {
    try {
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: youtubeScopes,
        })
        return res.redirect(url)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const youtubeAuthCallback = async (req:Request,res:Response) => {
    try {
        const { code } = req.query
        const { tokens } = await oauth2Client.getToken(code as string)
        oauth2Client.setCredentials(tokens)
        
        // Get YouTube user info
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
        const channelResponse = await youtube.channels.list({
            part: ['snippet,contentDetails,statistics'],
            mine: true
        })
        
        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            return res.status(400).json({ message: "No YouTube channel found" })
        }
        
        // Extract channel information
        const channelData = channelResponse.data.items[0]
        
        // Make sure we have the required data
        if (!channelData || !channelData.snippet) {
            return res.status(400).json({ message: "Invalid YouTube channel data" })
        }
        
        // Get current user from session/JWT
        // For now, this will be mocked as we don't have authentication middleware set up
        // In a real application, you'd get the user ID from the session or JWT
        // const userId = req.user.id
        // For testing, you can use a fixed user ID
        const userId = 1 // Replace with actual user ID when authentication is set up
        
        // Find the user
        const user = await User.findOne({ where: { id: userId } })
        
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        
        // Check if verification record already exists
        let socialVerification = await SocialVerification.findOne({
            where: { user: { id: userId }, platform: 'youtube' }
        })
        
        // If not, create a new one
        if (!socialVerification) {
            socialVerification = new SocialVerification()
            socialVerification.user = user
            socialVerification.platform = 'youtube'
        }
        
        // Update verification data
        socialVerification.isVerified = true
        socialVerification.verifiedAt = new Date()
        socialVerification.platformData = {
            channelId: channelData.id,
            channelTitle: channelData.snippet?.title || 'Unknown Channel',
            subscriberCount: channelData.statistics?.subscriberCount,
            viewCount: channelData.statistics?.viewCount,
            videoCount: channelData.statistics?.videoCount,
            thumbnails: channelData.snippet?.thumbnails || {}
        }
        
        // Save to database
        await socialVerification.save()
        
        // Return success
        return res.status(200).json({
            message: "YouTube account verified successfully",
            channelTitle: channelData.snippet?.title || 'Unknown Channel',
            isVerified: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}
