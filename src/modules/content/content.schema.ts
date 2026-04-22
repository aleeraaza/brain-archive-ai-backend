import { z } from "zod";

export const createContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    "NOTE",
    "BOOKMARK",
    "DOCUMENT",
    "TWEET",
    "VIDEO",
    "AUDIO",
    "IMAGE",
  ]),
  link: z.string().url("Invalid URL").optional(), // optional — notes won't have link
  body: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
