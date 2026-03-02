import {
    youtubeInitiateAuth,
    youtubeAuthCallback,
    facebookInitiateAuth,
    facebookAuthCallback,
    instagramInitiateAuth,
    instagramAuthCallback,
    tiktokInitiateAuth,
    tiktokAuthCallback,
    xInitiateAuth,
    xAuthCallback,
    linkedinInitiateAuth,
    linkedinAuthCallback
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

export const tiktokAuthController = async (req: Request, res: Response) => {
    return tiktokInitiateAuth(req, res)
}

export const tiktokAuthCallbackController = async (req: Request, res: Response) => {
    return tiktokAuthCallback(req, res)
}

export const xAuthController = async (req: Request, res: Response) => {
    return xInitiateAuth(req, res)
}

export const xAuthCallbackController = async (req: Request, res: Response) => {
    return xAuthCallback(req, res)
}

export const linkedinAuthController = async (req: Request, res: Response) => {
    return linkedinInitiateAuth(req, res)
}

export const linkedinAuthCallbackController = async (req: Request, res: Response) => {
    return linkedinAuthCallback(req, res)
}