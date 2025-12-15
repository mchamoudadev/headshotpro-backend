import crypto from "crypto";

export class VerificationService {

    private readonly tokenLength = 32;
    private readonly tokenExpires =  24; // 1 day

    // Generate verification token

     generateToken(): string{
        return crypto.randomBytes(this.tokenLength).toString('hex');
    }

    // Generate expiration date for verification token
    generateExpirationDate(): Date {
       
        const expires = new Date();
        expires.setHours(expires.getHours() + this.tokenExpires);
        return expires;
    }

    // Check if verification token is expired
    isTokenExpired(expires: Date): boolean {
        return new Date() > expires;
    }
    
}


export const verificationService = new VerificationService();