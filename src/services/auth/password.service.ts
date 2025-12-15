import bcrypt from "bcrypt";

export class PasswordService {


    private readonly saltRounds = 12;

    // hash password

    async hashPassword(password:string): Promise<string> {
        return await bcrypt.hash(password, this.saltRounds);
    }

    // compare password

    async comparePassword(password:string, hashedPassword:string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

}


export const passwordService = new PasswordService();