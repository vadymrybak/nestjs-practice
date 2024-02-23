import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const getUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
})