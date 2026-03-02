import {
    youtubeInitiateAuth,
    youtubeAuthCallback,
    facebookInitiateAuth,
    facebookAuthCallback,
    instagramInitiateAuth,
    instagramAuthCallback
} from "../services/social.verification"
import { Request, Response } from "express"


export const youtubeAuthController = async (req: Request, res: Response) => {
    return youtubeInitiateAuth(req, res)
}

export const youtubeAuthCallbackController = async (req: Request, res: Response) => {
    return youtubeAuthCallback(req, res)
}

export const facebookAuthController = async (req: Request, res: Response) => {
    return facebookInitiateAuth(req, res)
}

export const facebookAuthCallbackController = async (req: Request, res: Response) => {
    return facebookAuthCallback(req, res)
}

export const instagramAuthController = async (req: Request, res: Response) => {
    return instagramInitiateAuth(req, res)
}

export const instagramAuthCallbackController = async (req: Request, res: Response) => {
    return instagramAuthCallback(req, res)
}