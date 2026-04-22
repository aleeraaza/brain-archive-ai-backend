import { Router } from "express";
import { signinSchema, signUpSchema } from "./auth.schema.js";
import bcrypt from "bcryptjs";
import { JWT_SECRET, SALT_ROUNDS } from "../../config/config.js";
import { prisma } from "../../config/db.js";
import jwt from "jsonwebtoken";

export const userRouter = Router();

userRouter.post("/signup", async (req, res) => {
  const data = signUpSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({
      message: "Validation failed for user Sign Up!",
    });
  }

  const { email, fName, lName, password } = data.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fName,
        lName,
      },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      message: "User created successfully",
      token,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  const data = signinSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({
      message: "Validation failed for Sign In!", // ✅ fixed message
    });
  }

  const { email, password } = data.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      message: "Signed in successfully",
      token,
    });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
});
