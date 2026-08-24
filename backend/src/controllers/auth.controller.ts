import { Request, Response } from "express";
import { prisma } from "../config/database";
import {
  comparePassword,
  hashPassword
} from "../utils/password";
import { generateToken } from "../utils/jwt";
import {
  authenticateUser
} from "../services/auth.service";

export async function register(
  req: Request,
  res: Response
) {
  try {
    const {
      fullName,
      email,
      password,
      phone
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash
      }
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {

    const {
      email,
      password
    } = req.body;

    const result =
      await authenticateUser(
        email,
        password
      );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });

  } catch (error) {

    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (
      error instanceof Error &&
      error.message === "ACCOUNT_INACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
}