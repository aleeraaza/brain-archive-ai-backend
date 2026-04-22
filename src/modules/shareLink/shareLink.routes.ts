import { Router, type Response } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import type { AuthRequest } from "../../shared/types/index.js";
import { prisma } from "../../config/db.js";
import crypto from "crypto";

export const linkRouter = Router();

// POST /api/v1/brain/share
linkRouter.post(
  "/share",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { share } = req.body;

    try {
      if (share === true) {
        // Check if link already exists for this user
        const existingLink = await prisma.link.findFirst({
          where: { userId },
        });

        if (existingLink) {
          // Re-activate existing link
          const link = await prisma.link.update({
            where: { id: existingLink.id },
            data: { isActive: true },
          });

          return res.status(200).json({
            message: "Brain sharing enabled",
            shareUrl: `/brain/${link.hash}`,
            hash: link.hash,
          });
        }

        // Create new link with random hash
        const hash = crypto.randomBytes(8).toString("hex");

        const link = await prisma.link.create({
          data: {
            hash,
            userId,
            isActive: true,
          },
        });

        return res.status(201).json({
          message: "Brain sharing enabled",
          shareUrl: `/brain/${link.hash}`,
          hash: link.hash,
        });
      } else if (share === false) {
        // Disable sharing
        await prisma.link.updateMany({
          where: { userId },
          data: { isActive: false },
        });

        return res.status(200).json({
          message: "Brain sharing disabled",
        });
      } else {
        return res.status(400).json({
          message: "share field must be true or false",
        });
      }
    } catch (e) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

// ─────────────────────────────────────────────────
// GET /api/v1/brain/:hash
// Public route — anyone with the hash can view the brain
// NO auth middleware — this is public
// ─────────────────────────────────────────────────
linkRouter.get("/:hash", async (req, res: Response) => {
  const hash = req.params["hash"] as string;

  try {
    // Find the link by hash
    const link = await prisma.link.findUnique({
      where: { hash },
    });

    // Check link exists and is active
    if (!link || !link.isActive) {
      return res.status(404).json({
        message: "This brain is not shared or link is disabled",
      });
    }

    // Get all content of the brain owner
    const contents = await prisma.content.findMany({
      where: { userId: link.userId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "Brain fetched successfully",
      count: contents.length,
      contents,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
