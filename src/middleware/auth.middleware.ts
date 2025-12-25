

//Extend the Request interface to include the user

import { User, UserRole } from "@/models/User.model";
import { tokenService } from "@/services/auth/token.servivce";
import { UnAuthorizedError } from "@/util/errors";
import { NextFunction, Request, Response } from "express";


declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: UserRole;
            }
        }
    }
}


export const authenticate = async(req: Request, res: Response, next: NextFunction) : Promise<void> => {



    // get token from cookies


    // authentication 
    // autherization


    try {
        let token = req.cookies?.accessToken;

        if(!token){

            const authHeaders = req.headers.authorization;

            if(authHeaders?.startsWith('Bearer ')){
                token = authHeaders.substring(7);
            }
        }


        if(!token){
            throw new UnAuthorizedError("access token is required");
        }
        
        // verify token

        const payload = tokenService.verifyAccessToken(token);

        // TODO: revoke checking if token is revoked

        // verify user still exists and is active

        const user = await User.findById(payload.userId);

        if(!user || !user.isActive){
            throw new UnAuthorizedError("User is not active or does not exist");
        }

        // attach user to request

        req.user = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        }

        next();

    } catch (error) {
        throw new UnAuthorizedError("Unauthorized");
    }


}

export const authorize = (role: UserRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if(req.user?.role !== role){
            throw new UnAuthorizedError("Unauthorized");
        }
        next();
    }
}