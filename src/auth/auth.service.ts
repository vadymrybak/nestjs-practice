import { ForbiddenException, Injectable } from "@nestjs/common";
import { User, Bookmark } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }
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

        delete user.hash;

        return user;
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

            delete user.hash;

            // return user
            return user;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new ForbiddenException("Credentials taken");
                }
            }
            throw error;
        }

    }
}