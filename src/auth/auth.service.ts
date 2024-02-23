import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

    async signin(dto: AuthDto) {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });

        // If user does not exist - throw exception
        if (!user) {
            throw new ForbiddenException("Credential incorrect");
        }
        // Compare password

        const pwMatches = await argon.verify(user.hash, dto.password);

        // If pass incorrect - throw excpetion
        if (!pwMatches) {
            throw new ForbiddenException("Credentials incorect");
        }

        return this.signToken(user.id, user.email);
    }

    async signup(dto: AuthDto) {
        // generate password
        const hash = await argon.hash(dto.password);

        // save user to db
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash
                }
            });

            return this.signToken(user.id, user.email);
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new ForbiddenException("Credentials taken");
                }
            }
            throw error;
        }

    }

    async signToken(userId: number, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email
        }

        const secret = this.config.get("JWT_SECRET");
        const token = await this.jwt.signAsync(payload, {
            expiresIn: "15m",
            secret
        });

        return {
            access_token: token
        }
    }
}