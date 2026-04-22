import { Router, type Response } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import type { AuthRequest } from "../../shared/types/index.js";
import { createContentSchema } from "./content.schema.js";
import { prisma } from "../../config/db.js";

export const contentRouter = Router();

contentRouter.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    const data = createContentSchema.safeParse(req.body);
    if (!data.success) {
      return res.status(400).json({
        message: data.error.message,
      });
    }

    const { title, body, link, type, tags } = data.data;

    try {
      const content = await prisma.content.create({
        data: {
          title,
          body,
          link,
          type,
          userId: userId!,

          tags: {
            create: tags?.map((tagTitle) => ({
              tag: {
                connectOrCreate: {
                  where: {
                    userId_title: {
                      userId: userId!,
                      title: tagTitle,
                    },
                  },
                  create: {
                    title: tagTitle,
                    userId: userId!,
                  },
                },
              },
            })),
          },
        },

        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Content created successfully",
        content,
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

//get all content of user

contentRouter.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    try {
      const content = await prisma.content.findMany({
        where: {
          userId: userId,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return res.status(200).json({
        message: "Content Fetched Successfully",
        count: content.length,
        content,
      });
    } catch {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

contentRouter.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const contentId = req.params["id"] as string;
    try {
      const existing = await prisma.content.findFirst({
        where: {
          id: contentId,
          userId: userId,
        },
      });
      if (!existing) {
        return res.status(404).json({
          message: "Content not found",
        });
      }
      await prisma.content.delete({
        where: {
          id: contentId,
        },
      });
      return res.status(200).json({
        message: "Content deleted successfully",
      });
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);
