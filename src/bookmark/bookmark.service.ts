import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
    constructor(private prisma: PrismaService) { }

    getBookmarks(userId: number) {
        return this.prisma.bookmark.findMany({
            where: {
                userId
            }
        });
    }

    getBookmarkById(userId: number, bookmarkId: number) {
        return this.prisma.bookmark.findFirst({
            where: {
                userId,
                id: bookmarkId
            }
        });
    }

    async createBookmark(userId: number, dto: CreateBookmarkDto) {
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                ...dto
            }
        });
        return bookmark;
    }

    async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
        // Get bookmark by id
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            }
        });

        // Check if user owns the bookmark
        if (!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException("Access to the resource denied");
        }

        return this.prisma.bookmark.update({
            where: {
                id: bookmarkId
            },
            data: {
                ...dto
            }
        });
    }

    async deleteBookmarkById(userId: number, bookmarkId: number) {
        // Get bookmark by id
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            }
        });

        // Check if user owns the bookmark
        if (!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException("Access to the resource denied");
        }

        await this.prisma.bookmark.delete({
            where: {
                id: bookmarkId
            }
        });
    }

}
