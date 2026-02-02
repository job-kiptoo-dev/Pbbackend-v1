import { youtubeInitiateAuth, youtubeAuthCallback } from "../services/social.verification"
import { Request, Response } from "express"


export const youtubeAuthController = async (req:Request,res:Response) => {
    return youtubeInitiateAuth(req,res)
}

export const youtubeAuthCallbackController = async (req:Request,res:Response) => {
    return youtubeAuthCallback(req,res)
}